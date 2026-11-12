import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { CalendarDay, CalendarMonthData, DayData, HabitItem } from '../types';
import { api, triggerHaptic } from '../api';
import { CircularProgress, HabitIcon } from './Icons';

interface Props {
  initialYear?: number;
  initialMonth?: number;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenHabitForSelectedDate: (habit: HabitItem, dateStr: string) => void;
  refreshTrigger: number;
}

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTH_GENITIVE = [
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

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CalendarView: React.FC<Props> = ({
  initialYear = 2026,
  initialMonth = 11,
  selectedDate,
  onSelectDate,
  onOpenHabitForSelectedDate,
  refreshTrigger,
}) => {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [monthData, setMonthData] = useState<CalendarMonthData | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<DayData | null>(null);
  const [showDayBreakdown, setShowDayBreakdown] = useState(false);

  useEffect(() => {
    api.getCalendar(year, month).then(setMonthData).catch(console.error);
  }, [year, month, refreshTrigger]);

  useEffect(() => {
    if (selectedDate) {
      api.getDay(selectedDate).then(setSelectedDayDetails).catch(console.error);
    }
  }, [selectedDate, refreshTrigger]);

  const changeMonth = (delta: number) => {
    triggerHaptic('selection');
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const formatSelectedDateShort = (dateStr: string) => {
    const [, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTH_GENITIVE[(m || 1) - 1]}`;
  };

  const blankSlots = monthData ? Array.from({ length: monthData.first_weekday }) : [];

  return (
    <div className="px-4 pt-safe-header pb-28 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
          Календарь
        </h1>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          9 ноя 2026 — 8 ноя 2027
        </span>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-[#131B2E] rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800/80">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 flex items-center justify-center text-slate-500 dark:text-slate-400 transition"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
            {MONTH_NAMES[month - 1]} {year}
          </div>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 flex items-center justify-center text-slate-500 dark:text-slate-400 transition"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center mb-3">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2.5 text-center">
          {blankSlots.map((_, idx) => (
            <div key={`blank-${idx}`} className="h-10" />
          ))}

          {monthData?.days.map((d: CalendarDay) => {
            const isSelected = d.date === selectedDate;

            let circleStyle =
              'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
            let dotColor = '';

            if (!d.in_program) {
              circleStyle = 'text-slate-300 dark:text-slate-600';
            } else if (d.status === 'full') {
              if (isSelected) {
                circleStyle =
                  'bg-[#0057FF] text-white font-bold shadow-md shadow-blue-500/30';
                dotColor = 'bg-white';
              } else {
                circleStyle =
                  'bg-[#16A34A] text-white font-semibold shadow-sm shadow-emerald-500/20';
                dotColor = 'bg-white/90';
              }
            } else if (d.status === 'partial') {
              circleStyle = isSelected
                ? 'bg-[#BBF7D0] text-emerald-950 font-bold ring-2 ring-[#22C55E]'
                : 'bg-[#DCFCE7] dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-semibold';
              dotColor = 'bg-[#16A34A]';
            } else if (d.status === 'none') {
              circleStyle = isSelected
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold ring-2 ring-[#0057FF]'
                : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 font-medium';
            } else {
              // future
              circleStyle = isSelected
                ? 'ring-2 ring-[#0057FF] font-bold text-[#0057FF] dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 font-medium';
            }

            return (
              <div key={d.date} className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectDate(d.date);
                    setShowDayBreakdown(true);
                  }}
                  className={`relative w-10 h-10 rounded-full flex flex-col items-center justify-center text-[14.5px] transition active:scale-90 ${circleStyle}`}
                >
                  <span>{d.day}</span>
                  {dotColor && (
                    <span className="flex gap-0.5 mt-0.5">
                      <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                      {d.status === 'partial' && (
                        <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                      )}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Date Summary Bar inside Card */}
        {selectedDayDetails && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowDayBreakdown((prev) => !prev);
              }}
              className="w-full bg-slate-50/90 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl p-3.5 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3.5">
                <CircularProgress
                  completed={selectedDayDetails.completed_count}
                  total={selectedDayDetails.total_count}
                  size={44}
                  strokeWidth={5}
                  showLabel={false}
                />
                <div className="text-left">
                  <div className="text-[15.5px] font-bold text-slate-900 dark:text-white">
                    {formatSelectedDateShort(selectedDayDetails.date)}
                  </div>
                  <div className="text-[12.5px] text-slate-500 dark:text-slate-400">
                    {selectedDayDetails.completed_count} из {selectedDayDetails.total_count} привычек •{' '}
                    {selectedDayDetails.total_minutes} мин
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  showDayBreakdown ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Expandable habits breakdown for selected day */}
            {showDayBreakdown && (
              <div className="mt-3 space-y-2 animate-fadeIn">
                {selectedDayDetails.habits.map((h) => {
                  const done = h.completed || h.is_recovery;
                  return (
                    <div
                      key={h.id}
                      onClick={() => onOpenHabitForSelectedDate(h, selectedDayDetails.date)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0F1626] border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-200 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0057FF] dark:text-blue-400 flex items-center justify-center">
                          <HabitIcon id={h.id} iconName={h.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {h.short_title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {h.is_recovery
                              ? 'День восстановления'
                              : h.completed
                              ? `Выполнено • ${h.minutes_spent} мин`
                              : 'Не выполнено'}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          h.is_recovery
                            ? 'bg-blue-500 text-white'
                            : done
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {h.is_recovery ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : done ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-5 pt-2 text-[12px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span>Выполнено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#86EFAC]" />
            <span>Частично</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Не выполнено</span>
          </div>
        </div>
      </div>
    </div>
  );
};
