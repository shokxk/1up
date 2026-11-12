import React from 'react';
import { Home, Calendar, BarChart2 } from 'lucide-react';
import { triggerHaptic } from '../api';

export type TabKey = 'today' | 'calendar' | 'progress';

interface Props {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChange }) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'today', label: 'Сегодня', icon: <Home className="w-5 h-5" /> },
    { key: 'calendar', label: 'Календарь', icon: <Calendar className="w-5 h-5" /> },
    { key: 'progress', label: 'Прогресс', icon: <BarChart2 className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-xl border-t border-slate-200/70 dark:border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onChange(t.key);
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-[#0057FF] dark:text-blue-400 font-semibold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              {t.icon}
              <span className="text-[11px] tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
