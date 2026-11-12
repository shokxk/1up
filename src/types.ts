export interface PrayersState {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface HabitItem {
  id: string;
  title: string;
  short_title: string;
  default_minutes: number;
  category: 'sport' | 'study' | 'spiritual' | 'reading';
  icon: string;
  completed: boolean;
  is_recovery: boolean;
  minutes_spent: number;
  actual_logged_minutes: number;
  prayers: PrayersState;
}

export interface DayData {
  date: string;
  habits: HabitItem[];
  completed_count: number;
  total_count: number;
  total_minutes: number;
  newly_unlocked_achievements?: Achievement[];
}

export interface ProgramInfo {
  start_date: string;
  end_date: string;
  today_date: string;
  day_number: number;
  total_days: number;
  daily_quote: string;
}

export interface WeekBar {
  date: string;
  label: string;
  completed: number;
  total: number;
  percent: number;
  is_future: boolean;
}

export interface HabitStat {
  id: string;
  title: string;
  short_title: string;
  icon: string;
  completed_days: number;
  elapsed_days: number;
  percent: number;
  total_minutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  target_days: number;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string | null;
  progress_days: number;
  progress_percent: number;
}

export interface StatsData {
  streak_days: number;
  active_days_count: number;
  full_days_count: number;
  elapsed_days: number;
  total_program_days: number;
  total_minutes: number;
  total_hours: number;
  week: {
    percent: number;
    completed_actions: number;
    total_actions: number;
    bars: WeekBar[];
  };
  month: {
    percent: number;
    completed_actions: number;
    total_actions: number;
  };
  year: {
    percent: number;
    completed_actions: number;
    total_actions: number;
  };
  habits: HabitStat[];
  achievements: Achievement[];
}

export interface SettingsData {
  morning_time: string;
  evening_time: string;
  notifications_enabled: boolean;
  theme: 'light' | 'dark';
  program_start_date: string;
  telegram_chat_id: string;
}

export interface CalendarDay {
  date: string;
  day: number;
  weekday: number;
  status: 'full' | 'partial' | 'none' | 'future';
  completed_count: number;
  total_count: number;
  minutes_spent: number;
  is_today: boolean;
  in_program: boolean;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  first_weekday: number;
  days: CalendarDay[];
  program_start: string;
  program_end: string;
  today: string;
}

export interface BootstrapResponse {
  user: {
    id: number;
    first_name: string;
    username?: string;
    is_dev?: boolean;
  };
  program: ProgramInfo;
  today: DayData;
  stats: StatsData;
  settings: SettingsData;
  habits: {
    id: string;
    title: string;
    short_title: string;
    default_minutes: number;
    category: string;
    icon: string;
    sort_order: number;
  }[];
}
