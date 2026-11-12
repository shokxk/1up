import React, { useEffect, useState } from 'react';
import { api, triggerHaptic } from './api';
import { getLocalBootstrap } from './localStore';
import {
  Achievement,
  BootstrapResponse,
  HabitItem,
  PrayersState,
} from './types';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { ProgressView } from './components/ProgressView';
import { BottomNav, TabKey } from './components/BottomNav';
import { HabitModal } from './components/HabitModal';
import { AchievementsSheet } from './components/AchievementsSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { AchievementIcon } from './components/Icons';

export const App: React.FC = () => {
  const [data, setData] = useState<BootstrapResponse | null>(() => getLocalBootstrap());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('today');

  // Modals / Sheets
  const [activeHabit, setActiveHabit] = useState<{
    habit: HabitItem;
    dateStr: string;
  } | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [celebrationAch, setCelebrationAch] = useState<Achievement | null>(null);

  // Calendar state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-11-10');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    try {
      window.Telegram?.WebApp?.ready();
      window.Telegram?.WebApp?.expand();
    } catch {
      // ignore outside Telegram
    }
    loadInitial();
  }, []);

  useEffect(() => {
    const theme = data?.settings.theme || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      window.Telegram?.WebApp?.setBackgroundColor?.('#090D16');
    } else {
      root.classList.remove('dark');
      window.Telegram?.WebApp?.setBackgroundColor?.('#F2F4F8');
    }
  }, [data?.settings.theme]);

  const loadInitial = async () => {
    try {
      const localNow = getLocalBootstrap();
      setData(localNow);
      setSelectedCalendarDate(localNow.program.today_date);
      const res = await api.bootstrap();
      setData(res);
      setSelectedCalendarDate(res.program.today_date);
    } catch {
      // Already rendered from local store
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habit: HabitItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;

    const currentlyDone = habit.completed || habit.is_recovery;
    const nextCompleted = !currentlyDone;
    triggerHaptic(nextCompleted ? 'success' : 'light');

    // Optimistic update
    const optimisticHabits = data.today.habits.map((h) =>
      h.id === habit.id
        ? {
            ...h,
            completed: nextCompleted,
            is_recovery: false,
            minutes_spent: nextCompleted ? h.default_minutes : 0,
          }
        : h
    );
    const optimisticCount = optimisticHabits.filter(
      (h) => h.completed || h.is_recovery
    ).length;

    setData({
      ...data,
      today: {
        ...data.today,
        habits: optimisticHabits,
        completed_count: optimisticCount,
      },
    });

    try {
      const updated = await api.updateHabit(habit.id, {
        date: data.today.date,
        completed: nextCompleted,
        is_recovery: false,
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              today: updated.day,
              stats: updated.stats,
            }
          : prev
      );
      setRefreshTrigger((x) => x + 1);

      if (
        updated.day.newly_unlocked_achievements &&
        updated.day.newly_unlocked_achievements.length > 0
      ) {
        setCelebrationAch(updated.day.newly_unlocked_achievements[0]);
      }
    } catch (err) {
      console.error(err);
      loadInitial();
    }
  };

  const handleSaveHabitModal = async (
    habitId: string,
    payload: {
      completed?: boolean;
      is_recovery?: boolean;
      minutes_spent?: number;
      prayers?: Partial<PrayersState>;
    }
  ) => {
    if (!data) return;
    const targetDate = activeHabit?.dateStr || data.today.date;
    const updated = await api.updateHabit(habitId, {
      date: targetDate,
      ...payload,
    });

    setData((prev) => {
      if (!prev) return prev;
      const isToday = targetDate === prev.today.date;
      return {
        ...prev,
        today: isToday ? updated.day : prev.today,
        stats: updated.stats,
      };
    });

    // Update activeHabit if still open (e.g. toggling Namaz prayers)
    const refreshedHabit = updated.day.habits.find((h) => h.id === habitId);
    if (refreshedHabit && activeHabit) {
      setActiveHabit({ habit: refreshedHabit, dateStr: targetDate });
    }
    setRefreshTrigger((x) => x + 1);

    if (
      updated.day.newly_unlocked_achievements &&
      updated.day.newly_unlocked_achievements.length > 0
    ) {
      setCelebrationAch(updated.day.newly_unlocked_achievements[0]);
    }
  };

  const handleSaveSettings = async (payload: {
    morning_time?: string;
    evening_time?: string;
    notifications_enabled?: boolean;
    theme?: 'light' | 'dark';
    habit_durations?: Record<string, number>;
  }) => {
    const res = await api.updateSettings(payload);
    setData((prev) =>
      prev
        ? {
            ...prev,
            settings: res.settings,
            today: res.today,
          }
        : prev
    );
  };

  const handleAddHabit = async (payload: {
    title: string;
    default_minutes: number;
    category: 'sport' | 'study' | 'spiritual' | 'reading';
    icon: string;
  }) => {
    triggerHaptic('success');
    const res = await api.createHabit(payload);
    setData((prev) =>
      prev
        ? {
            ...prev,
            today: res.today,
            stats: res.stats,
          }
        : prev
    );
    setRefreshTrigger((x) => x + 1);
  };

  const handleDeleteHabit = async (habitId: string) => {
    const res = await api.deleteHabit(habitId);
    setData((prev) =>
      prev
        ? {
            ...prev,
            today: res.today,
            stats: res.stats,
          }
        : prev
    );
    setRefreshTrigger((x) => x + 1);
  };

  const handleResetSession = async () => {
    const res = await api.resetSession();
    setData((prev) =>
      prev
        ? {
            ...prev,
            program: res.program,
            today: res.today,
            stats: res.stats,
            settings: res.settings,
          }
        : prev
    );
    setSelectedCalendarDate(res.program.today_date);
    setRefreshTrigger((x) => x + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F4F8] dark:bg-[#090D16] text-slate-900 dark:text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#0057FF] text-white font-black italic text-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          1UP
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#F2F4F8] dark:bg-[#090D16]">
        <div className="bg-white dark:bg-[#131B2E] p-6 rounded-3xl shadow-sm max-w-sm w-full space-y-3">
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            Доступ ограничен
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error || 'Откройте приложение через официального Telegram-бота @oneup365bot'}
          </p>
          <button
            type="button"
            onClick={loadInitial}
            className="w-full py-2.5 rounded-xl bg-[#0057FF] text-white text-sm font-semibold"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F8] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 max-w-md mx-auto relative shadow-2xl shadow-slate-900/5">
      {/* Main Screen Switcher */}
      {activeTab === 'today' && (
        <TodayView
          program={data.program}
          today={data.today}
          stats={data.stats}
          onToggleHabit={handleToggleHabit}
          onOpenHabit={(habit) =>
            setActiveHabit({ habit, dateStr: data.today.date })
          }
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenSettings={() => setShowSettings(true)}
          onAddHabit={handleAddHabit}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarView
          initialYear={Number(data.program.today_date.split('-')[0]) || 2026}
          initialMonth={Number(data.program.today_date.split('-')[1]) || 11}
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
          onOpenHabitForSelectedDate={(habit, dateStr) =>
            setActiveHabit({ habit, dateStr })
          }
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressView
          stats={data.stats}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Bottom Navigation (3 Tabs) */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Fullscreen Habit Timer / Details Modal */}
      <HabitModal
        habit={activeHabit?.habit || null}
        onClose={() => setActiveHabit(null)}
        onSave={handleSaveHabitModal}
      />

      {/* Achievements Sheet */}
      {showAchievements && (
        <AchievementsSheet
          achievements={data.stats.achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Settings Sheet */}
      {showSettings && (
        <SettingsSheet
          settings={data.settings}
          habits={data.today.habits}
          onClose={() => setShowSettings(false)}
          onSaveSettings={handleSaveSettings}
          onDeleteHabit={handleDeleteHabit}
          onResetSession={handleResetSession}
          onReloadAll={loadInitial}
        />
      )}

      {/* Achievement Unlocked Celebration Toast */}
      {celebrationAch && (
        <div
          onClick={() => setCelebrationAch(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn"
        >
          <div className="bg-white dark:bg-[#131B2E] rounded-[28px] p-6 max-w-xs w-full text-center shadow-2xl space-y-3 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
              <AchievementIcon icon={celebrationAch.icon} className="w-8 h-8" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#22C55E]">
              Новое достижение!
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {celebrationAch.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {celebrationAch.subtitle}
            </p>
            <button
              type="button"
              onClick={() => setCelebrationAch(null)}
              className="w-full py-2.5 mt-2 rounded-xl bg-[#0057FF] text-white text-sm font-semibold"
            >
              Продолжить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
