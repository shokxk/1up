import {
  BootstrapResponse,
  CalendarMonthData,
  DayData,
  PrayersState,
  SettingsData,
  StatsData,
} from './types';
import {
  calculateLocalStats,
  getLocalBootstrap,
  getLocalCalendarMonth,
  getLocalDayLogs,
  getTodayIsoTashkent,
  localCreateHabit,
  localDeleteHabit,
  localResetSession,
  localUpdateSettings,
  localUpsertHabitLog,
  mergeServerBootstrapIntoLocal,
} from './localStore';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'selection' = 'light') {
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (hf) {
      if (type === 'success') {
        hf.notificationOccurred('success');
      } else if (type === 'selection') {
        hf.selectionChanged();
      } else {
        hf.impactOccurred(type);
      }
      return;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'success' ? [15, 30, 20] : 10);
    }
  } catch {
    // ignore
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getTelegramInitData(),
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(path, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Ошибка запроса: ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hybrid Local-First + Server Sync API:
 * - Saves every action immediately to iPhone/Browser localStorage (so data is NEVER lost even offline or when PC is off).
 * - Syncs with the FastAPI SQLite server in the background whenever reachable.
 */
export const api = {
  bootstrap: async (targetDate?: string): Promise<BootstrapResponse> => {
    try {
      const serverRes = await request<BootstrapResponse>(
        `/api/bootstrap${targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : ''}`
      );
      mergeServerBootstrapIntoLocal(serverRes);
    } catch {
      // Offline or PC is turned off — use local autonomous storage seamlessly
    }
    return getLocalBootstrap(targetDate);
  },

  getDay: async (dateStr: string): Promise<DayData> => {
    return getLocalDayLogs(dateStr);
  },

  updateHabit: async (
    habitId: string,
    payload: {
      date?: string;
      completed?: boolean;
      is_recovery?: boolean;
      minutes_spent?: number;
      prayers?: Partial<PrayersState>;
    }
  ): Promise<{ day: DayData; stats: StatsData }> => {
    const dateIso = payload.date || getTodayIsoTashkent();
    const localResult = localUpsertHabitLog(dateIso, habitId, payload);

    // Sync to server in background if online
    request(`/api/habit/${habitId}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, date: dateIso }),
    }).catch(() => {});

    return localResult;
  },

  getCalendar: async (year: number, month: number): Promise<CalendarMonthData> => {
    return getLocalCalendarMonth(year, month);
  },

  getStats: async (): Promise<StatsData> => {
    return calculateLocalStats();
  },

  updateSettings: async (payload: {
    morning_time?: string;
    evening_time?: string;
    notifications_enabled?: boolean;
    theme?: 'light' | 'dark';
    habit_durations?: Record<string, number>;
  }): Promise<{ settings: SettingsData; today: DayData }> => {
    const localResult = localUpdateSettings(payload);
    request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).catch(() => {});
    return localResult;
  },

  createHabit: async (payload: {
    title: string;
    default_minutes: number;
    category: 'sport' | 'study' | 'spiritual' | 'reading';
    icon: string;
  }): Promise<{ today: DayData; stats: StatsData }> => {
    const localResult = localCreateHabit(payload);
    request('/api/habits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch(() => {});
    return localResult;
  },

  deleteHabit: async (habitId: string): Promise<{ today: DayData; stats: StatsData }> => {
    const localResult = localDeleteHabit(habitId);
    request(`/api/habits/${habitId}`, {
      method: 'DELETE',
    }).catch(() => {});
    return localResult;
  },

  resetSession: async () => {
    const localResult = localResetSession();
    request('/api/reset', {
      method: 'POST',
    }).catch(() => {});
    return localResult;
  },
};
