import {
  Achievement,
  BootstrapResponse,
  CalendarDay,
  CalendarMonthData,
  DayData,
  HabitItem,
  PrayersState,
  ProgramInfo,
  SettingsData,
  StatsData,
} from './types';

const STORAGE_KEY = 'oneup_local_store_v1';

export interface HabitDefinition {
  id: string;
  title: string;
  short_title: string;
  default_minutes: number;
  category: 'sport' | 'study' | 'spiritual' | 'reading';
  icon: string;
  sort_order: number;
}

export interface StoredLogEntry {
  completed: boolean;
  is_recovery: boolean;
  minutes_spent: number;
  prayers: PrayersState;
  updated_at: string;
}

export interface LocalStoreState {
  version: number;
  settings: SettingsData;
  habits: HabitDefinition[];
  logs: Record<string, Record<string, StoredLogEntry>>; // logs[dateIso][habitId]
  unlocked_achievements: Record<string, string>; // achievementId -> unlockedAtIso
}

export const DEFAULT_HABITS_DEF: HabitDefinition[] = [
  {
    id: 'workout',
    title: 'Тренировка',
    short_title: 'Тренировка',
    default_minutes: 5,
    category: 'sport',
    icon: 'dumbbell',
    sort_order: 1,
  },
  {
    id: 'running',
    title: 'Бег',
    short_title: 'Бег',
    default_minutes: 10,
    category: 'sport',
    icon: 'footprints',
    sort_order: 2,
  },
  {
    id: 'pullups',
    title: 'Турник',
    short_title: 'Турник',
    default_minutes: 5,
    category: 'sport',
    icon: 'trophy',
    sort_order: 3,
  },
  {
    id: 'driving',
    title: 'Обучение на водительские права',
    short_title: 'Права',
    default_minutes: 10,
    category: 'study',
    icon: 'car',
    sort_order: 4,
  },
  {
    id: 'namaz',
    title: 'Намаз / изучение',
    short_title: 'Намаз / изучение',
    default_minutes: 10,
    category: 'spiritual',
    icon: 'landmark',
    sort_order: 5,
  },
  {
    id: 'reading',
    title: 'Чтение книги',
    short_title: 'Чтение книги',
    default_minutes: 5,
    category: 'reading',
    icon: 'book-open',
    sort_order: 6,
  },
];

const ACHIEVEMENTS_DEF = [
  {
    id: 'day_1',
    title: 'Первый день',
    subtitle: 'Сделай шаг к новой версии себя',
    target_days: 1,
    icon: 'zap',
  },
  {
    id: 'day_7',
    title: '7 дней регулярности',
    subtitle: 'Закрепи дисциплину',
    target_days: 7,
    icon: 'calendar',
  },
  {
    id: 'day_30',
    title: '30 дней',
    subtitle: 'Сформируй устойчивую привычку',
    target_days: 30,
    icon: 'star',
  },
  {
    id: 'day_100',
    title: '100 дней',
    subtitle: 'Покажи силу постоянства',
    target_days: 100,
    icon: 'trophy',
  },
  {
    id: 'day_365',
    title: '365 дней',
    subtitle: 'Полный цикл 1UP',
    target_days: 365,
    icon: 'crown',
  },
];

export function getTodayIsoTashkent(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatIsoDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, delta: number): string {
  const dt = parseIsoDate(iso);
  dt.setDate(dt.getDate() + delta);
  return formatIsoDate(dt);
}

function diffDays(isoA: string, isoB: string): number {
  const a = parseIsoDate(isoA);
  const b = parseIsoDate(isoB);
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function getMondayWeekday(iso: string): number {
  const jsDay = parseIsoDate(iso).getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7; // 0=Mon..6=Sun
}

export function loadLocalStore(): LocalStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalStoreState;
      if (parsed && parsed.settings && Array.isArray(parsed.habits)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupt storage
  }

  const initial: LocalStoreState = {
    version: 1,
    settings: {
      morning_time: '07:00',
      evening_time: '22:00',
      notifications_enabled: true,
      theme: 'light',
      program_start_date: '2026-11-09',
      telegram_chat_id: '',
    },
    habits: [...DEFAULT_HABITS_DEF],
    logs: {},
    unlocked_achievements: {},
  };
  saveLocalStore(initial);
  return initial;
}

export function saveLocalStore(state: LocalStoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota error
  }
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function mergeServerBootstrapIntoLocal(res: BootstrapResponse): void {
  const state = loadLocalStore();
  if (res.settings) {
    state.settings = { ...state.settings, ...res.settings };
  }
  if (res.habits && res.habits.length > 0) {
    state.habits = res.habits.map((h) => ({
      id: h.id,
      title: h.title,
      short_title: h.short_title,
      default_minutes: h.default_minutes,
      category: h.category as HabitDefinition['category'],
      icon: h.icon,
      sort_order: h.sort_order,
    }));
  }
  if (res.today && res.today.date) {
    const dIso = res.today.date;
    state.logs[dIso] = state.logs[dIso] || {};
    for (const h of res.today.habits) {
      // Only overwrite if local doesn't already have an entry or server has activity
      if (!state.logs[dIso][h.id] || h.completed || h.is_recovery) {
        state.logs[dIso][h.id] = {
          completed: h.completed,
          is_recovery: h.is_recovery,
          minutes_spent: h.completed ? h.minutes_spent : 0,
          prayers: h.prayers || {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
          },
          updated_at: new Date().toISOString(),
        };
      }
    }
  }
  saveLocalStore(state);
}

export function getLocalProgramInfo(state = loadLocalStore()): ProgramInfo {
  const startDate = state.settings.program_start_date || '2026-11-09';
  const endDate = addDays(startDate, 364);
  const todayDate = getTodayIsoTashkent();
  const rawDayNum = diffDays(todayDate, startDate) + 1;
  const clampedDay = Math.max(1, Math.min(365, rawDayNum));

  return {
    start_date: startDate,
    end_date: endDate,
    today_date: todayDate,
    day_number: clampedDay,
    total_days: 365,
    daily_quote: '',
  };
}

export function getLocalDayLogs(dateIso: string, state = loadLocalStore()): DayData {
  const dayMap = state.logs[dateIso] || {};
  const habitsSorted = [...state.habits].sort((a, b) => a.sort_order - b.sort_order);

  let completedCount = 0;
  let totalMinutes = 0;

  const items: HabitItem[] = habitsSorted.map((h) => {
    const entry = dayMap[h.id];
    const completed = entry ? Boolean(entry.completed) : false;
    const isRecovery = entry ? Boolean(entry.is_recovery) : false;
    const loggedMins = entry ? Number(entry.minutes_spent) : 0;
    const prayers: PrayersState = entry?.prayers || {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };

    if (completed || isRecovery) {
      completedCount += 1;
    }
    if (completed) {
      totalMinutes += loggedMins;
    }

    return {
      id: h.id,
      title: h.title,
      short_title: h.short_title,
      default_minutes: h.default_minutes,
      category: h.category,
      icon: h.icon,
      completed,
      is_recovery: isRecovery,
      minutes_spent: completed || loggedMins > 0 ? loggedMins : h.default_minutes,
      actual_logged_minutes: completed ? loggedMins : 0,
      prayers,
    };
  });

  return {
    date: dateIso,
    habits: items,
    completed_count: completedCount,
    total_count: habitsSorted.length,
    total_minutes: totalMinutes,
  };
}

export function calculateLocalStats(state = loadLocalStore()): StatsData {
  const habitsSorted = [...state.habits].sort((a, b) => a.sort_order - b.sort_order);
  const totalHabitsCount = habitsSorted.length;
  const program = getLocalProgramInfo(state);
  const startDate = program.start_date;
  const today = program.today_date;

  let totalMinutesAllTime = 0;
  const habitCompletedCounts: Record<string, number> = {};
  const habitMinutesTotals: Record<string, number> = {};
  habitsSorted.forEach((h) => {
    habitCompletedCounts[h.id] = 0;
    habitMinutesTotals[h.id] = 0;
  });

  let activeDaysCount = 0;
  let fullDaysCount = 0;

  for (const [, dayMap] of Object.entries(state.logs)) {
    let dayDoneCnt = 0;
    for (const [hid, entry] of Object.entries(dayMap)) {
      const isDone = entry.completed || entry.is_recovery;
      if (isDone) {
        dayDoneCnt += 1;
        if (hid in habitCompletedCounts) {
          habitCompletedCounts[hid] += 1;
        }
      }
      if (entry.completed) {
        const mins = Number(entry.minutes_spent) || 0;
        totalMinutesAllTime += mins;
        if (hid in habitMinutesTotals) {
          habitMinutesTotals[hid] += mins;
        }
      }
    }
    if (dayDoneCnt > 0) activeDaysCount += 1;
    if (dayDoneCnt >= totalHabitsCount && totalHabitsCount > 0) fullDaysCount += 1;
  }

  // Calculate streak
  let streak = 0;
  let cursorDate = today;
  const todayMap = state.logs[today] || {};
  const todayDone = Object.values(todayMap).filter((e) => e.completed || e.is_recovery).length;
  if (todayDone === 0) {
    cursorDate = addDays(today, -1);
  }

  while (true) {
    const dMap = state.logs[cursorDate] || {};
    const doneCnt = Object.values(dMap).filter((e) => e.completed || e.is_recovery).length;
    if (doneCnt > 0) {
      streak += 1;
      cursorDate = addDays(cursorDate, -1);
    } else {
      break;
    }
  }

  const elapsedProgramDays = Math.max(1, Math.min(365, diffDays(today, startDate) + 1));
  const weekWindowDays = Math.min(7, elapsedProgramDays);

  const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const mondayOfWeek = addDays(today, -getMondayWeekday(today));
  const weekBars = [];

  for (let i = 0; i < 7; i++) {
    const dIso = addDays(mondayOfWeek, i);
    const dMap = state.logs[dIso] || {};
    const doneCnt = Object.values(dMap).filter((e) => e.completed || e.is_recovery).length;
    const pct = totalHabitsCount ? Math.round((doneCnt / totalHabitsCount) * 100) : 0;
    weekBars.push({
      date: dIso,
      label: weekdayNames[i],
      completed: doneCnt,
      total: totalHabitsCount,
      percent: pct,
      is_future: dIso > today,
    });
  }

  let weekActionsDone = 0;
  for (let i = 0; i < weekWindowDays; i++) {
    const dIso = addDays(today, -i);
    const dMap = state.logs[dIso] || {};
    weekActionsDone += Object.values(dMap).filter((e) => e.completed || e.is_recovery).length;
  }
  const weekActionsTotal = weekWindowDays * totalHabitsCount;
  const weekPercent = weekActionsTotal ? Math.round((weekActionsDone / weekActionsTotal) * 100) : 0;

  const monthWindowDays = Math.min(30, elapsedProgramDays);
  let monthActionsDone = 0;
  for (let i = 0; i < monthWindowDays; i++) {
    const dIso = addDays(today, -i);
    const dMap = state.logs[dIso] || {};
    monthActionsDone += Object.values(dMap).filter((e) => e.completed || e.is_recovery).length;
  }
  const monthActionsTotal = monthWindowDays * totalHabitsCount;
  const monthPercent = monthActionsTotal
    ? Math.round((monthActionsDone / monthActionsTotal) * 100)
    : 0;

  let yearActionsDone = 0;
  for (const [dIso, dMap] of Object.entries(state.logs)) {
    if (dIso >= startDate && dIso <= program.end_date) {
      yearActionsDone += Object.values(dMap).filter((e) => e.completed || e.is_recovery).length;
    }
  }
  const yearActionsTotal = 365 * totalHabitsCount;
  const yearPercent =
    yearActionsDone > 0
      ? Math.max(1, Math.round((yearActionsDone / yearActionsTotal) * 100))
      : 0;

  const habitStats = habitsSorted.map((h) => {
    const doneDays = habitCompletedCounts[h.id] || 0;
    const pct =
      elapsedProgramDays > 0 ? Math.min(100, Math.round((doneDays / elapsedProgramDays) * 100)) : 0;
    return {
      id: h.id,
      title: h.title,
      short_title: h.short_title,
      icon: h.icon,
      completed_days: doneDays,
      elapsed_days: elapsedProgramDays,
      percent: pct,
      total_minutes: habitMinutesTotals[h.id] || 0,
    };
  });

  const progressDaysMetric = Math.max(streak, activeDaysCount);
  const achievementsList: Achievement[] = ACHIEVEMENTS_DEF.map((ach) => {
    const isUnlocked =
      Boolean(state.unlocked_achievements[ach.id]) || progressDaysMetric >= ach.target_days;
    const pct = Math.min(100, Math.round((progressDaysMetric / ach.target_days) * 100));
    return {
      ...ach,
      unlocked: isUnlocked,
      unlocked_at: state.unlocked_achievements[ach.id] || null,
      progress_days: Math.min(ach.target_days, progressDaysMetric),
      progress_percent: pct,
    };
  });

  return {
    streak_days: streak,
    active_days_count: activeDaysCount,
    full_days_count: fullDaysCount,
    elapsed_days: elapsedProgramDays,
    total_program_days: 365,
    total_minutes: totalMinutesAllTime,
    total_hours: Math.round((totalMinutesAllTime / 60) * 10) / 10,
    week: {
      percent: weekPercent,
      completed_actions: weekActionsDone,
      total_actions: weekActionsTotal,
      bars: weekBars,
    },
    month: {
      percent: monthPercent,
      completed_actions: monthActionsDone,
      total_actions: monthActionsTotal,
    },
    year: {
      percent: yearPercent,
      completed_actions: yearActionsDone,
      total_actions: yearActionsTotal,
    },
    habits: habitStats,
    achievements: achievementsList,
  };
}

export function localUpsertHabitLog(
  dateIso: string,
  habitId: string,
  payload: {
    completed?: boolean;
    is_recovery?: boolean;
    minutes_spent?: number;
    prayers?: Partial<PrayersState>;
  }
): { day: DayData; stats: StatsData } {
  const state = loadLocalStore();
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) {
    throw new Error('Habit not found');
  }

  state.logs[dateIso] = state.logs[dateIso] || {};
  const existing = state.logs[dateIso][habitId];

  let curCompleted = existing ? existing.completed : false;
  let curRecovery = existing ? existing.is_recovery : false;
  let curMinutes = existing ? existing.minutes_spent : 0;
  const curPrayers: PrayersState = existing?.prayers
    ? { ...existing.prayers }
    : { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

  if (payload.completed !== undefined) {
    curCompleted = payload.completed;
    if (curCompleted && curMinutes === 0) {
      curMinutes = habit.default_minutes;
    }
    if (!curCompleted && !curRecovery) {
      curMinutes = 0;
    }
    if (curCompleted) {
      curRecovery = false;
    }
  }

  if (payload.is_recovery !== undefined) {
    curRecovery = payload.is_recovery;
    if (curRecovery) {
      curCompleted = true;
      curMinutes = 0;
    }
  }

  if (payload.minutes_spent !== undefined) {
    curMinutes = Math.max(0, Math.min(600, Number(payload.minutes_spent)));
  }

  if (payload.prayers) {
    Object.assign(curPrayers, payload.prayers);
  }

  state.logs[dateIso][habitId] = {
    completed: curCompleted,
    is_recovery: curRecovery,
    minutes_spent: curMinutes,
    prayers: curPrayers,
    updated_at: new Date().toISOString(),
  };

  // Check newly unlocked achievements
  const statsBefore = calculateLocalStats(state);
  const progressDays = Math.max(statsBefore.streak_days, statsBefore.active_days_count);
  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS_DEF) {
    if (!state.unlocked_achievements[ach.id] && progressDays >= ach.target_days) {
      state.unlocked_achievements[ach.id] = new Date().toISOString();
      newlyUnlocked.push({
        ...ach,
        unlocked: true,
        unlocked_at: state.unlocked_achievements[ach.id],
        progress_days: ach.target_days,
        progress_percent: 100,
      });
    }
  }

  saveLocalStore(state);
  const day = getLocalDayLogs(dateIso, state);
  day.newly_unlocked_achievements = newlyUnlocked;
  const stats = calculateLocalStats(state);
  return { day, stats };
}

export function getLocalCalendarMonth(year: number, month: number): CalendarMonthData {
  const state = loadLocalStore();
  const totalHabits = state.habits.length;
  const program = getLocalProgramInfo(state);
  const startDate = program.start_date;
  const endDate = program.end_date;
  const today = program.today_date;

  const firstDayIso = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstWeekday = getMondayWeekday(firstDayIso);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dIso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dMap = state.logs[dIso] || {};
    let doneCnt = 0;
    let mins = 0;
    for (const entry of Object.values(dMap)) {
      if (entry.completed || entry.is_recovery) doneCnt += 1;
      if (entry.completed) mins += Number(entry.minutes_spent) || 0;
    }

    let status: CalendarDay['status'] = 'none';
    if (dIso > today || dIso < startDate || dIso > endDate) {
      if (doneCnt >= totalHabits && totalHabits > 0) status = 'full';
      else if (doneCnt > 0) status = 'partial';
      else status = 'future';
    } else {
      if (doneCnt >= totalHabits && totalHabits > 0) status = 'full';
      else if (doneCnt > 0) status = 'partial';
      else status = 'none';
    }

    days.push({
      date: dIso,
      day: d,
      weekday: getMondayWeekday(dIso),
      status,
      completed_count: doneCnt,
      total_count: totalHabits,
      minutes_spent: mins,
      is_today: dIso === today,
      in_program: dIso >= startDate && dIso <= endDate,
    });
  }

  return {
    year,
    month,
    first_weekday: firstWeekday,
    days,
    program_start: startDate,
    program_end: endDate,
    today,
  };
}

export function localUpdateSettings(payload: {
  morning_time?: string;
  evening_time?: string;
  notifications_enabled?: boolean;
  theme?: 'light' | 'dark';
  habit_durations?: Record<string, number>;
}): { settings: SettingsData; today: DayData } {
  const state = loadLocalStore();
  if (payload.morning_time !== undefined) state.settings.morning_time = payload.morning_time;
  if (payload.evening_time !== undefined) state.settings.evening_time = payload.evening_time;
  if (payload.notifications_enabled !== undefined)
    state.settings.notifications_enabled = payload.notifications_enabled;
  if (payload.theme !== undefined) state.settings.theme = payload.theme;

  if (payload.habit_durations) {
    state.habits = state.habits.map((h) =>
      payload.habit_durations && payload.habit_durations[h.id] !== undefined
        ? { ...h, default_minutes: Math.max(1, Math.min(300, payload.habit_durations[h.id])) }
        : h
    );
  }

  saveLocalStore(state);
  return {
    settings: state.settings,
    today: getLocalDayLogs(getTodayIsoTashkent(), state),
  };
}

export function localCreateHabit(payload: {
  title: string;
  default_minutes: number;
  category: 'sport' | 'study' | 'spiritual' | 'reading';
  icon: string;
}): { today: DayData; stats: StatsData } {
  const state = loadLocalStore();
  const nextOrder =
    state.habits.reduce((max, h) => Math.max(max, h.sort_order), 0) + 1;
  const newHabit: HabitDefinition = {
    id: `custom_${Date.now().toString(36)}`,
    title: payload.title.trim(),
    short_title: payload.title.trim(),
    default_minutes: Math.max(1, Math.min(300, payload.default_minutes)),
    category: payload.category,
    icon: payload.icon,
    sort_order: nextOrder,
  };
  state.habits.push(newHabit);
  saveLocalStore(state);
  return {
    today: getLocalDayLogs(getTodayIsoTashkent(), state),
    stats: calculateLocalStats(state),
  };
}

export function localDeleteHabit(habitId: string): { today: DayData; stats: StatsData } {
  const state = loadLocalStore();
  if (state.habits.length <= 1) {
    return {
      today: getLocalDayLogs(getTodayIsoTashkent(), state),
      stats: calculateLocalStats(state),
    };
  }
  state.habits = state.habits.filter((h) => h.id !== habitId);
  for (const dMap of Object.values(state.logs)) {
    delete dMap[habitId];
  }
  saveLocalStore(state);
  return {
    today: getLocalDayLogs(getTodayIsoTashkent(), state),
    stats: calculateLocalStats(state),
  };
}

export function localResetSession(): {
  program: ProgramInfo;
  today: DayData;
  stats: StatsData;
  settings: SettingsData;
} {
  const state = loadLocalStore();
  state.logs = {};
  state.unlocked_achievements = {};
  state.settings.program_start_date = getTodayIsoTashkent();
  saveLocalStore(state);
  const program = getLocalProgramInfo(state);
  return {
    program,
    today: getLocalDayLogs(program.today_date, state),
    stats: calculateLocalStats(state),
    settings: state.settings,
  };
}

export function exportLocalBackupJson(): string {
  const state = loadLocalStore();
  return JSON.stringify(state, null, 2);
}

export function importLocalBackupJson(jsonStr: string): BootstrapResponse {
  const parsed = JSON.parse(jsonStr) as LocalStoreState;
  if (!parsed || !parsed.settings || !Array.isArray(parsed.habits)) {
    throw new Error('Неверный формат файла резервной копии 1UP');
  }
  saveLocalStore(parsed);
  return getLocalBootstrap();
}

export function getLocalBootstrap(targetDate?: string): BootstrapResponse {
  const state = loadLocalStore();
  const program = getLocalProgramInfo(state);
  const dateStr = targetDate || program.today_date;
  return {
    user: { id: 1, first_name: '1UP User' },
    program,
    today: getLocalDayLogs(dateStr, state),
    stats: calculateLocalStats(state),
    settings: state.settings,
    habits: state.habits,
  };
}
