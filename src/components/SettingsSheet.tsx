import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Moon,
  Info,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { HabitItem, SettingsData } from '../types';
import { HabitIcon } from './Icons';
import { triggerHaptic } from '../api';
import { exportLocalBackupJson, importLocalBackupJson } from '../localStore';

interface Props {
  settings: SettingsData;
  habits: HabitItem[];
  onClose: () => void;
  onSaveSettings: (payload: {
    morning_time?: string;
    evening_time?: string;
    notifications_enabled?: boolean;
    theme?: 'light' | 'dark';
    habit_durations?: Record<string, number>;
  }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onResetSession: () => Promise<void>;
  onReloadAll: () => void;
}

export const SettingsSheet: React.FC<Props> = ({
  settings,
  habits,
  onClose,
  onSaveSettings,
  onDeleteHabit,
  onResetSession,
  onReloadAll,
}) => {
  const [expandedSection, setExpandedSection] = useState<
    'durations' | 'backup' | 'about' | null
  >(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    habits.forEach((h) => {
      map[h.id] = h.default_minutes;
    });
    return map;
  });

  const handleThemeToggle = async () => {
    triggerHaptic('selection');
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await onSaveSettings({ theme: nextTheme });
  };

  const adjustDuration = async (habitId: string, delta: number) => {
    triggerHaptic('selection');
    const cur = durations[habitId] || 5;
    const next = Math.max(1, Math.min(180, cur + delta));
    const updated = { ...durations, [habitId]: next };
    setDurations(updated);
    await onSaveSettings({ habit_durations: updated });
  };

  const handleExportBackup = () => {
    triggerHaptic('success');
    const json = exportLocalBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1up-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Резервная копия сохранена в файлы телефона');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importLocalBackupJson(String(reader.result || ''));
        triggerHaptic('success');
        setBackupMsg('Данные успешно восстановлены!');
        onReloadAll();
      } catch (err: any) {
        setBackupMsg(err.message || 'Ошибка чтения файла');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F4F8] dark:bg-[#090D16] overflow-y-auto animate-fadeIn">
      <div className="max-w-md mx-auto px-4 pt-safe-header pb-12">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 mb-3 rounded-full bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition text-sm font-semibold"
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5 -ml-1" />
          <span>Назад</span>
        </button>

        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white mb-5 px-1">
          Настройки
        </h1>

        <div className="space-y-3">
          {/* Row 1: Продолжительность */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[22px] border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_14px_rgb(0,0,0,0.03)] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setExpandedSection(expandedSection === 'durations' ? null : 'durations');
              }}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15.5px] font-bold text-slate-900 dark:text-white">
                    Продолжительность
                  </div>
                  <div className="text-[12.5px] text-slate-400">
                    Настроить время привычек
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-slate-300 transition-transform ${
                  expandedSection === 'durations' ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSection === 'durations' && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HabitIcon id={h.id} iconName={h.icon} className="w-4 h-4 text-[#0057FF] shrink-0" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {h.short_title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustDuration(h.id, -1)}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-14 text-center text-slate-900 dark:text-white">
                        {durations[h.id] ?? h.default_minutes} мин
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustDuration(h.id, 1)}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {habits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('medium');
                            onDeleteHabit(h.id);
                          }}
                          title="Удалить привычку"
                          className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center ml-1 active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Тема */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="w-full bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_14px_rgb(0,0,0,0.03)] flex items-center justify-between text-left active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-[15.5px] font-bold text-slate-900 dark:text-white">
                Тема
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-slate-400">
              <span>{settings.theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </button>

          {/* Row 4: Автономное хранение и Резервная копия */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[22px] border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_14px_rgb(0,0,0,0.03)] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setExpandedSection(expandedSection === 'backup' ? null : 'backup');
              }}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15.5px] font-bold text-slate-900 dark:text-white">
                    Память и резервная копия
                  </div>
                  <div className="text-[12.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Автономный режим активен 24/7
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-slate-300 transition-transform ${
                  expandedSection === 'backup' ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSection === 'backup' && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-500 dark:text-slate-400">
                <p className="leading-relaxed">
                  Все ваши отметки и привычки надёжно сохраняются прямо в памяти вашего телефона и дублируются на сервер. Вы можете в любой момент скачать файл резервной копии или восстановить его.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0057FF] text-white font-semibold text-xs active:scale-95 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать копию</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs active:scale-95 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Восстановить</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>

                {backupMsg && (
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-center pt-1">
                    {backupMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 5: О приложении */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[22px] border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_14px_rgb(0,0,0,0.03)] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setExpandedSection(expandedSection === 'about' ? null : 'about');
              }}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[15.5px] font-bold text-slate-900 dark:text-white">
                    О приложении
                  </div>
                  <div className="text-[12.5px] text-slate-400">1UP v1.0</div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-slate-300 transition-transform ${
                  expandedSection === 'about' ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSection === 'about' && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">1UP | Habit Tracker</strong> — персональная программа 365 дней дисциплины.
                </p>
                <p>Начало текущего цикла: {settings.program_start_date}.</p>
                <p>Добавьте страницу на экран «Домой» в браузере телефона, чтобы открывать 1UP как нативное приложение.</p>
              </div>
            )}
          </div>

          {/* Row 5: Сбросить сессию (Начать заново с Дня 1) */}
          <div className="pt-2">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setConfirmReset(true);
                }}
                className="w-full bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-red-100 dark:border-red-900/40 shadow-[0_2px_14px_rgb(0,0,0,0.03)] flex items-center justify-between text-left active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[15.5px] font-bold text-red-600 dark:text-red-400">
                      Сбросить сессию
                    </div>
                    <div className="text-[12.5px] text-slate-400">
                      Обнулить прогресс и начать с Дня 1
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ) : (
              <div className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-red-200 dark:border-red-900/60 space-y-3 animate-fadeIn">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Начать цикл 365 дней заново?
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Все прошлые отметки, часы и достижения будут сброшены, а сегодняшний день станет <strong>Днём 1 из 365</strong>. Список ваших привычек сохранится.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={async () => {
                      triggerHaptic('success');
                      setResetting(true);
                      try {
                        await onResetSession();
                        setConfirmReset(false);
                        onClose();
                      } finally {
                        setResetting(false);
                      }
                    }}
                    className="py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-sm"
                  >
                    {resetting ? 'Сброс...' : 'Да, сбросить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
