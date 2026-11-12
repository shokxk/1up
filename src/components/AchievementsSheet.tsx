import React from 'react';
import { ChevronLeft, Check, Lock } from 'lucide-react';
import { Achievement } from '../types';
import { AchievementIcon } from './Icons';

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsSheet: React.FC<Props> = ({ achievements, onClose }) => {
  // Find the first locked achievement to show its active progress bar (like "7 дней подряд" in screenshot)
  const firstLockedIndex = achievements.findIndex((a) => !a.unlocked);

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F4F8] dark:bg-[#090D16] overflow-y-auto animate-fadeIn">
      <div className="max-w-md mx-auto px-4 pt-safe-header pb-12">
        {/* Back button */}
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
          Достижения
        </h1>

        <div className="space-y-3">
          {achievements.map((ach, idx) => {
            const isUnlocked = ach.unlocked;
            const showProgressBar = !isUnlocked && idx === firstLockedIndex;
            const isWarmIcon = isUnlocked || showProgressBar;

            return (
              <div
                key={ach.id}
                className="bg-white dark:bg-[#131B2E] rounded-[22px] p-4 border border-slate-100 dark:border-slate-800/80 shadow-[0_2px_14px_rgb(0,0,0,0.03)] flex items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isWarmIcon
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <AchievementIcon icon={ach.icon} className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-bold text-slate-900 dark:text-white">
                      {ach.title}
                    </div>
                    <div className="text-[12.5px] text-slate-400 dark:text-slate-400 mt-0.5">
                      {ach.subtitle}
                    </div>

                    {showProgressBar && (
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(8, ach.progress_percent)}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {ach.progress_percent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Status Badge */}
                {isUnlocked ? (
                  <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : !showProgressBar ? (
                  <Lock className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mr-1" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
