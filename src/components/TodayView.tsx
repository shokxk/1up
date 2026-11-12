import React, { useState } from 'react';
import { ChevronRight, Check, RotateCcw, Settings, Plus, X } from 'lucide-react';
import { DayData, HabitItem, ProgramInfo, StatsData } from '../types';
import { CircularProgress, HabitIcon, OneUpLogo } from './Icons';
import { triggerHaptic } from '../api';

interface Props {
  program: ProgramInfo;
  today: DayData;
  stats: StatsData;
  onToggleHabit: (habit: HabitItem, e: React.MouseEvent) => void;
  onOpenHabit: (habit: HabitItem) => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onAddHabit: (payload: {
    title: string;
    default_minutes: number;
    category: 'sport' | 'study' | 'spiritual' | 'reading';
    icon: string;
  }) => Promise<void>;
}

function formatRussianDate(dateIso: string): string {
  try {
    const [y, m, d] = dateIso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const weekdays = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];
    return `${weekdays[dt.getDay()]}, ${d} ${months[dt.getMonth()]}`;
  } catch {
    return dateIso;
  }
}

function pluralHabitsLeft(rem: number): string {
  if (rem <= 0) return 'Все привычки выполнены!';
  if (rem === 1) return 'Осталась 1 привычка';
  if (rem >= 2 && rem <= 4) return `Осталось ${rem} привычки`;
  return `Осталось ${rem} привычек`;
}

export const TodayView: React.FC<Props> = ({
  program,
  today,
  stats,
  onToggleHabit,
  onOpenHabit,
  onOpenAchievements,
  onOpenSettings,
  onAddHabit,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(10);
  const [newCategory, setNewCategory] = useState<'sport' | 'study' | 'spiritual' | 'reading'>('study');
  const [newIcon, setNewIcon] = useState('star');
  const [adding, setAdding] = useState(false);

  const completed = today.completed_count;
  const total = today.total_count;
  const remaining = Math.max(0, total - completed);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await onAddHabit({
        title: newTitle.trim(),
        default_minutes: newMinutes,
        category: newCategory,
        icon: newIcon,
      });
      setNewTitle('');
      setNewMinutes(10);
      setShowAddModal(false);
    } finally {
      setAdding(false);
    }
  };

  const statusHeadline =
    completed === 0
      ? 'Время начать день!'
      : completed >= total
      ? 'Идеальный день!'
      : 'Хороший темп!';

  return (
    <div className="pb-28">
      {/* Blue Header Hero Section */}
      <div className="relative bg-gradient-to-b from-[#0051FF] via-[#0B5CFF] to-[#F2F4F8] dark:to-[#090D16] pt-safe-header pb-16 px-5 text-white">
        {/* Top Row: Logo + Streak Pill + Settings Icon */}
        <div className="flex items-center justify-between mb-5">
          <OneUpLogo className="text-white" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAchievements();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md text-xs font-semibold tracking-tight transition shadow-sm"
            >
              <span>🔥</span>
              <span>{stats.streak_days} {stats.streak_days === 1 ? 'день' : stats.streak_days >= 2 && stats.streak_days <= 4 ? 'дня' : 'дней'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenSettings();
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 backdrop-blur-md flex items-center justify-center transition"
              aria-label="Настройки"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Date & Title */}
        <div className="space-y-0.5">
          <p className="text-[13px] font-medium text-blue-100/90">
            {formatRussianDate(today.date)}
          </p>
          <h1 className="text-[32px] font-bold tracking-tight leading-tight">
            Сегодня
          </h1>
          <p className="text-[13px] font-medium text-blue-100/85">
            День {program.day_number} из {program.total_days}
          </p>
        </div>
      </div>

      {/* Main Content Container overlapping the hero gradient */}
      <div className="px-4 -mt-11 space-y-3 relative z-10">
        {/* Progress Summary Card */}
        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenAchievements();
          }}
          className="bg-white dark:bg-[#131B2E] rounded-[24px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between cursor-pointer active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-4">
            <CircularProgress completed={completed} total={total} size={74} strokeWidth={7.5} />
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
                {statusHeadline}
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                {pluralHabitsLeft(remaining)}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 mr-1" />
        </div>

        {/* Habits List */}
        <div className="space-y-2.5 pt-1">
          {today.habits.map((habit) => {
            const isDone = habit.completed || habit.is_recovery;
            const prayersDoneCount = habit.prayers
              ? Object.values(habit.prayers).filter(Boolean).length
              : 0;

            return (
              <div
                key={habit.id}
                onClick={() => {
                  triggerHaptic('light');
                  onOpenHabit(habit);
                }}
                className="bg-white dark:bg-[#131B2E] rounded-[20px] px-4 py-3.5 shadow-[0_2px_12px_rgb(0,0,0,0.03)] dark:shadow-none border border-slate-100/90 dark:border-slate-800/80 flex items-center justify-between cursor-pointer active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <HabitIcon id={habit.id} iconName={habit.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15.5px] font-semibold text-slate-900 dark:text-white truncate">
                      {habit.short_title}
                    </div>
                    <div className="text-[12.5px] text-slate-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      {habit.is_recovery ? (
                        <span className="text-blue-500 dark:text-blue-400 font-medium">
                          День восстановления
                        </span>
                      ) : (
                        <span>
                          {habit.completed ? habit.minutes_spent : habit.default_minutes} минут
                        </span>
                      )}
                      {habit.id === 'namaz' && prayersDoneCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                          Намаз {prayersDoneCount}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Circular Check Button */}
                <button
                  type="button"
                  onClick={(e) => onToggleHabit(habit, e)}
                  aria-label={`Отметить ${habit.short_title}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 active:scale-75 ${
                    habit.is_recovery
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                      : isDone
                      ? 'bg-[#22C55E] text-white shadow-sm shadow-emerald-500/30 scale-100'
                      : 'border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-transparent'
                  }`}
                >
                  {habit.is_recovery ? (
                    <RotateCcw className="w-4 h-4 stroke-[2.5] animate-popIn" />
                  ) : isDone ? (
                    <Check className="w-4 h-4 stroke-[3] animate-popIn" />
                  ) : null}
                </button>
              </div>
            );
          })}

          {/* Add New Habit Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowAddModal(true);
            }}
            className="w-full py-3.5 rounded-[20px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#0057FF]/50 text-slate-500 dark:text-slate-400 hover:text-[#0057FF] dark:hover:text-blue-400 flex items-center justify-center gap-2 text-[14px] font-semibold transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Добавить привычку</span>
          </button>
        </div>

        {/* Add Habit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pb-24 overflow-y-auto animate-fadeIn">
            <form
              onSubmit={handleCreateSubmit}
              className="bg-white dark:bg-[#131B2E] w-full max-w-sm rounded-[28px] p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 my-auto max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">
                  Новая привычка
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Название привычки
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Английский язык"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-[#0057FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Время (минут)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value) || 5)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Категория
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium outline-none"
                  >
                    <option value="study">Обучение</option>
                    <option value="sport">Спорт</option>
                    <option value="reading">Чтение</option>
                    <option value="spiritual">Духовное</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Иконка
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    'star',
                    'dumbbell',
                    'footprints',
                    'brain',
                    'code',
                    'book-open',
                    'heart',
                    'water',
                    'flame',
                    'zap',
                    'car',
                    'landmark',
                  ].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewIcon(ic)}
                      className={`h-10 rounded-xl flex items-center justify-center transition ${
                        newIcon === ic
                          ? 'bg-[#0057FF] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <HabitIcon id={ic} iconName={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                className="w-full py-3 rounded-2xl bg-[#0057FF] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md shadow-blue-500/20"
              >
                {adding ? 'Сохранение...' : 'Добавить привычку'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
