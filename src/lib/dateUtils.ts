/**
 * Browser-local Timezone Date Utilities
 * Ensures study session dates and timestamp queries match the user's local calendar
 * rather than UTC day boundaries.
 */

/**
 * Returns a Date representing 00:00:00.000 at the start of the specified day
 * in the user's local browser timezone.
 */
export function getLocalStartOfDay(date: Date | string = new Date()): Date {
  if (typeof date === 'string') {
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Returns a Date representing 23:59:59.999 at the end of the specified day
 * in the user's local browser timezone.
 */
export function getLocalEndOfDay(date: Date | string = new Date()): Date {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    const parsed = new Date(date);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Returns a 'YYYY-MM-DD' string formatted in the user's local browser timezone.
 * Supports offset in days (e.g. -1 for yesterday, 0 for today, +1 for tomorrow).
 */
export function getLocalDateString(date: Date = new Date(), offsetDays = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a 'YYYY-MM-DD' string to a local Date at 12:00:00 (midday)
 * to avoid JS UTC parsing offset issues.
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Determines whether a session timestamp falls between local start and end bounds.
 */
export function isSessionInDateRange(
  sessionStartTime: string | Date,
  start: Date,
  end: Date
): boolean {
  if (!sessionStartTime) return false;
  const time = new Date(sessionStartTime).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/**
 * Checks whether a session started on the specified local calendar day.
 */
export function isSessionOnLocalDate(
  sessionStartTime: string | Date,
  targetDate: Date | string = new Date()
): boolean {
  const start = getLocalStartOfDay(targetDate);
  const end = getLocalEndOfDay(targetDate);
  return isSessionInDateRange(sessionStartTime, start, end);
}

/**
 * Helper to get local start and end of "Yesterday"
 */
export function getYesterdayRange(): { startOfDay: Date; endOfDay: Date } {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    startOfDay: getLocalStartOfDay(yesterday),
    endOfDay: getLocalEndOfDay(yesterday),
  };
}

/**
 * Helper to get local start and end of "Today"
 */
export function getTodayRange(): { startOfDay: Date; endOfDay: Date } {
  const today = new Date();
  return {
    startOfDay: getLocalStartOfDay(today),
    endOfDay: getLocalEndOfDay(today),
  };
}
