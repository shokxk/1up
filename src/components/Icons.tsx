import React from 'react';
import {
  Dumbbell,
  Footprints,
  Car,
  Landmark,
  BookOpen,
  Zap,
  Calendar,
  Star,
  Trophy,
  Crown,
  Heart,
  Brain,
  Code,
  Droplets,
  Moon,
  Flame,
} from 'lucide-react';

export const OneUpLogo: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`inline-flex items-center select-none ${className}`}>
    <span
      className="font-black italic tracking-tighter text-[26px] leading-none text-white"
      style={{
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        letterSpacing: '-0.06em',
      }}
    >
      1UP
    </span>
  </div>
);

export const PullUpBarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 5h18" />
    <path d="M5 5v16" />
    <path d="M19 5v16" />
    <path d="M9 5v5" />
    <path d="M15 5v5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M9 15h6" />
  </svg>
);

export const HabitIcon: React.FC<{ id: string; iconName?: string; className?: string }> = ({
  id,
  iconName,
  className = 'w-5 h-5',
}) => {
  const key = iconName || id;
  switch (key) {
    case 'workout':
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'running':
    case 'footprints':
      return <Footprints className={className} />;
    case 'pullups':
    case 'bar':
      return <PullUpBarIcon className={className} />;
    case 'driving':
    case 'car':
      return <Car className={className} />;
    case 'namaz':
    case 'landmark':
      return <Landmark className={className} />;
    case 'reading':
    case 'book-open':
      return <BookOpen className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'water':
      return <Droplets className={className} />;
    case 'sleep':
      return <Moon className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'trophy':
      return id === 'pullups' ? <PullUpBarIcon className={className} /> : <Trophy className={className} />;
    default:
      return <Star className={className} />;
  }
};

export const AchievementIcon: React.FC<{ icon: string; className?: string }> = ({
  icon,
  className = 'w-5 h-5',
}) => {
  switch (icon) {
    case 'zap':
      return <Zap className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'crown':
      return <Crown className={className} />;
    default:
      return <Star className={className} />;
  }
};

export const CircularProgress: React.FC<{
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}> = ({ completed, total, size = 76, strokeWidth = 7.5, showLabel = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, completed / total) : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#22C55E"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
          {completed}/{total}
        </span>
      )}
    </div>
  );
};
