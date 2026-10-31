export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface TimetableItem {
  id: string;
  dayOfWeek: DayOfWeek;
  subjectId?: string;
  subjectName: string;
  targetSeconds: number; // e.g. 7200 for 2h
  color: string; // hex color for accent
  createdAt?: string;
}

export interface GoalStreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true (completed)
}

export interface DayOfWeekConfig {
  key: DayOfWeek;
  label: string;
  short: string;
  jsDay: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export const DAYS_OF_WEEK: DayOfWeekConfig[] = [
  { key: 'mon', label: 'Monday', short: 'Mon', jsDay: 1 },
  { key: 'tue', label: 'Tuesday', short: 'Tue', jsDay: 2 },
  { key: 'wed', label: 'Wednesday', short: 'Wed', jsDay: 3 },
  { key: 'thu', label: 'Thursday', short: 'Thu', jsDay: 4 },
  { key: 'fri', label: 'Friday', short: 'Fri', jsDay: 5 },
  { key: 'sat', label: 'Saturday', short: 'Sat', jsDay: 6 },
  { key: 'sun', label: 'Sunday', short: 'Sun', jsDay: 0 },
];

export const TIMETABLE_COLOR_PRESETS = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

export function getTodayDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay();
  const match = DAYS_OF_WEEK.find(d => d.jsDay === jsDay);
  return match ? match.key : 'mon';
}

export function getDayConfig(day: DayOfWeek): DayOfWeekConfig {
  return DAYS_OF_WEEK.find(d => d.key === day) || DAYS_OF_WEEK[0];
}
