import React, { useState } from 'react';
import { Clock, Calendar, Target, Award, Settings } from 'lucide-react';
import { StatsData } from '../types';
import { HabitIcon } from './Icons';
import { triggerHaptic } from '../api';

interface Props {
  stats: StatsData;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export const ProgressView: React.FC<Props> = ({
  stats,
  onOpenAchievements,
  onOpenSettings,
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const currentMetric =
    period === 'week'
      ? {
          title: 'Выполнение за неделю',
          percent: stats.week.percent,
          subtitle: `${stats.week.completed_actions} из ${stats.week.total_actions} действий`,
        }
      : period === 'month'
      ? {
          title: 'Выполнение за месяц',
          percent: stats.month.percent,
          subtitle: `${stats.month.completed_actions} из ${stats.month.total_actions} действий`,
        }
      : {
          title: 'Выполнение за год (365 дней)',
          percent: stats.year.percent,
          subtitle: `${stats.year.completed_actions} из ${stats.year.total_actions} действий`,
        };

  return (
    <div className="px-4 pt-safe-header pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
          Прогресс
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenAchievements();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Достижения</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition"
            aria-label="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Period Segmented Control (Неделя / Месяц / Год) */}
      <div className="bg-white dark:bg-[#131B2E] p-1 rounded-full grid grid-cols-3 border border-slate-100 dark:border-slate-800 shadow-sm">
        {(
          [
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
            { key: 'year', label: 'Год' },
          ] as const
        ).map((tab) => {
          const active = period === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setPeriod(tab.key);
              }}
              className={`py-2 rounded-full text-[13.5px] font-semibold transition-all ${
                active
                  ? 'bg-[#0057FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Blue Completion Hero Card with Vertical Bar Chart */}
      <div className="bg-gradient-to-br from-[#0057FF] to-[#1A6BFF] rounded-[26px] p-5 text-white shadow-lg shadow-blue-500/20 flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-blue-100/90">
            {currentMetric.title}
          </p>
          <div className="text-[42px] font-bold tracking-tight leading-none my-2">
            {currentMetric.percent}%
          </div>
          <p className="text-[12.5px] text-blue-100/85">
            {currentMetric.subtitle}
          </p>
        </div>

        {/* 7 Vertical Bars matching the design */}
        <div className="flex items-end gap-2 h-20 pb-0.5">
          {stats.week.bars.map((bar, idx) => {
            const heightPct = Math.max(18, bar.percent || (idx + 2) * 10);
            const hasRealActivity = bar.completed > 0;
            return (
              <div
                key={bar.date}
                className="flex flex-col items-center gap-1"
                title={`${bar.label}: ${bar.completed}/${bar.total}`}
              >
                <div className="w-2.5 h-16 bg-white/15 rounded-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-full transition-all duration-500 ${
                      hasRealActivity ? 'bg-white/90' : 'bg-white/35'
                    }`}
                    style={{
                      height: `${hasRealActivity ? Math.max(22, bar.percent) : heightPct * 0.4}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2x2 Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak Card */}
        <div className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-lg shrink-0">
            🔥
          </div>
          <div>
            <div className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">
              {stats.streak_days}
            </div>
            <div className="text-[12px] text-slate-400">Дней подряд</div>
          </div>
        </div>

        {/* Total Time Card */}
        <div className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">
              {stats.total_hours >= 1
                ? `${String(stats.total_hours).replace('.', ',')} ч`
                : `${stats.total_minutes} м`}
            </div>
            <div className="text-[12px] text-slate-400">Всего времени</div>
          </div>
        </div>

        {/* Elapsed Days / 365 */}
        <div className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">
              {stats.elapsed_days} / 365
            </div>
            <div className="text-[12px] text-slate-400">Пройдено дней</div>
          </div>
        </div>

        {/* Overall Program Progress */}
        <div className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight">
              {stats.year.percent}%
            </div>
            <div className="text-[12px] text-slate-400">Общий прогресс</div>
          </div>
        </div>
      </div>

      {/* Per-Habit Progress Section */}
      <div className="pt-2 space-y-2.5">
        <h2 className="text-[18px] font-bold text-slate-900 dark:text-white px-1">
          Привычки
        </h2>

        {stats.habits.map((h) => (
          <div
            key={h.id}
            className="bg-white dark:bg-[#131B2E] rounded-[20px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_12px_rgb(0,0,0,0.03)] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center shrink-0">
              <HabitIcon id={h.id} iconName={h.icon} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">
                  {h.short_title}
                </span>
                <span className="text-[14px] font-bold text-slate-900 dark:text-white">
                  {h.percent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                  style={{ width: `${h.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
