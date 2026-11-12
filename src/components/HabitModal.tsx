import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, RotateCcw, Plus, Minus } from 'lucide-react';
import { HabitItem, PrayersState } from '../types';
import { HabitIcon } from './Icons';
import { triggerHaptic } from '../api';

interface Props {
  habit: HabitItem | null;
  onClose: () => void;
  onSave: (
    habitId: string,
    payload: {
      completed?: boolean;
      is_recovery?: boolean;
      minutes_spent?: number;
      prayers?: Partial<PrayersState>;
    }
  ) => Promise<void>;
}

const PRAYER_NAMES: { key: keyof PrayersState; label: string; timeHint: string }[] = [
  { key: 'fajr', label: 'Фаджр (Бомдод)', timeHint: 'Утренняя' },
  { key: 'dhuhr', label: 'Зухр (Пешин)', timeHint: 'Полуденная' },
  { key: 'asr', label: 'Аср (Аср)', timeHint: 'Послеполуденная' },
  { key: 'maghrib', label: 'Магриб (Шом)', timeHint: 'Вечерняя' },
  { key: 'isha', label: 'Иша (Хуфтон)', timeHint: 'Ночная' },
];

export const HabitModal: React.FC<Props> = ({ habit, onClose, onSave }) => {
  const [minutes, setMinutes] = useState<number>(5);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [prayers, setPrayers] = useState<PrayersState>({
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (habit) {
      const initialMins =
        habit.minutes_spent > 0 ? habit.minutes_spent : habit.default_minutes;
      setMinutes(initialMins);
      setSecondsLeft(initialMins * 60);
      setIsRunning(false);
      setPrayers(
        habit.prayers || {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
        }
      );
    }
  }, [habit]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          triggerHaptic('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!habit) return null;

  const totalSeconds = Math.max(60, minutes * 60);
  const progressPct = Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds));
  const size = 236;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Start with a nice visible arc like the screenshot
  const visualPct = isRunning || secondsLeft < totalSeconds ? progressPct : 0.62;
  const dashOffset = circumference * (1 - visualPct);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const isSport = habit.category === 'sport';
  const isNamaz = habit.id === 'namaz';

  const adjustMinutes = (delta: number) => {
    triggerHaptic('selection');
    const next = Math.max(1, Math.min(180, minutes + delta));
    setMinutes(next);
    setSecondsLeft(next * 60);
    setIsRunning(false);
  };

  const togglePrayer = async (key: keyof PrayersState) => {
    triggerHaptic('light');
    const nextPrayers = { ...prayers, [key]: !prayers[key] };
    setPrayers(nextPrayers);
    const anyChecked = Object.values(nextPrayers).some(Boolean);
    await onSave(habit.id, {
      prayers: nextPrayers,
      completed: anyChecked || habit.completed,
      minutes_spent: minutes,
    });
  };

  const handleComplete = async () => {
    triggerHaptic('success');
    setSaving(true);
    try {
      await onSave(habit.id, {
        completed: true,
        is_recovery: false,
        minutes_spent: minutes,
        prayers: isNamaz ? prayers : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRecovery = async () => {
    triggerHaptic('medium');
    setSaving(true);
    try {
      await onSave(habit.id, {
        completed: true,
        is_recovery: true,
        minutes_spent: 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0E2A6E] via-[#0B2159] to-[#081742] text-white animate-fadeIn overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-safe-header pb-2">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white transition"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
          <span>Назад</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <HabitIcon id={habit.id} iconName={habit.icon} className="w-5 h-5 text-blue-300" />
        </div>
        <div className="w-10" />
      </div>

      {/* Title */}
      <div className="text-center px-6 mt-1">
        <h2 className="text-2xl font-bold tracking-tight">{habit.short_title}</h2>
        <p className="text-xs text-blue-200/75 mt-1">
          {isNamaz
            ? 'Обязательные молитвы и духовное изучение (без ограничения таймером)'
            : 'Настрой фактически потраченное время или запусти таймер'}
        </p>
      </div>

      {/* Circular Timer & Duration Adjuster */}
      <div className="flex flex-col items-center justify-center my-5">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#2563EB"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[46px] font-bold tracking-tight tabular-nums leading-none">
              {mm}:{ss}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => adjustMinutes(-1)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition"
                title="Уменьшить время"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-blue-200/90 min-w-[60px] text-center">
                {minutes} мин
              </span>
              <button
                type="button"
                onClick={() => adjustMinutes(1)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition"
                title="Увеличить время"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Play / Pause Floating Button at bottom of circle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsRunning((r) => !r);
            }}
            className="absolute -bottom-5 w-16 h-16 rounded-full bg-white text-[#1E40AF] shadow-xl flex items-center justify-center active:scale-95 transition"
          >
            {isRunning ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Namaz 5 Obligatory Prayers Section */}
      {isNamaz && (
        <div className="px-6 mt-4 mb-2 max-w-md mx-auto w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Обязательные молитвы (5/5)
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {Object.values(prayers).filter(Boolean).length} из 5
              </span>
            </div>
            <div className="space-y-1.5">
              {PRAYER_NAMES.map((p) => {
                const checked = prayers[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePrayer(p.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                      checked
                        ? 'bg-emerald-500/25 border border-emerald-400/40'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-[11px] text-blue-200/70">{p.timeHint}</div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                        checked
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-white/30'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="mt-auto pt-4 pb-10 px-8 flex items-center justify-center gap-12">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleComplete}
            className="w-16 h-16 rounded-full bg-white/15 hover:bg-emerald-500/80 active:scale-95 border border-white/20 flex items-center justify-center transition shadow-lg"
          >
            <Check className="w-7 h-7 text-white stroke-[2.5]" />
          </button>
          <span className="text-xs font-medium text-blue-100">Выполнено</span>
        </div>

        {isSport && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleRecovery}
              className={`w-16 h-16 rounded-full active:scale-95 border flex items-center justify-center transition shadow-lg ${
                habit.is_recovery
                  ? 'bg-blue-500 border-blue-300'
                  : 'bg-white/15 hover:bg-white/25 border-white/20'
              }`}
            >
              <RotateCcw className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <span className="text-xs font-medium text-blue-100">Восстановление</span>
          </div>
        )}
      </div>
    </div>
  );
};
