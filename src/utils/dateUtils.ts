/**
 * Date and time utilities for Pineapple Plantation Tracker
 * Formats timestamps in 12-hour format with local timezone (Asia/Karachi default)
 */

export function formatDateTime(
  dateInput: string | Date | undefined,
  timeZone: string = 'Asia/Karachi',
  includeSeconds: boolean = false
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  } catch {
    // Fallback if timezone not recognized
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  }
}

export function formatTimeOnly(
  dateInput: string | Date | undefined,
  timeZone: string = 'Asia/Karachi'
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

export function formatDateOnly(
  dateInput: string | Date | undefined,
  timeZone: string = 'Asia/Karachi'
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Converts a Date or ISO string into YYYY-MM-DDTHH:mm for datetime-local input fields
 */
export function toInputDateTimeString(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
}

/**
 * Returns time difference in seconds between target date and now
 * Positive means future, negative means past (overdue)
 */
export function getRemainingSeconds(targetDate: string | Date, now: Date = new Date()): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) return 0;
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

/**
 * Formats a duration in seconds into a human-readable countdown string
 */
export function formatCountdown(secondsDiff: number): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean; // within 10 min
  seconds: number;
} {
  const isOverdue = secondsDiff < 0;
  const absSeconds = Math.abs(secondsDiff);
  const isDueSoon = !isOverdue && secondsDiff <= 600; // 10 minutes

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let text = '';
  if (hours > 0) {
    text = `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  } else if (minutes > 0) {
    text = `${pad(minutes)}m ${pad(seconds)}s`;
  } else {
    text = `${pad(seconds)}s`;
  }

  if (isOverdue) {
    text = `-${text} overdue`;
  }

  return { text, isOverdue, isDueSoon, seconds: secondsDiff };
}

/**
 * Formats money with commas and currency symbol
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  const formatted = new Intl.NumberFormat('en-US').format(Math.round(amount));
  return `${currency}${formatted}`;
}

/**
 * 1-Hour Slot Cycle Timer:
 * Each nourishment slot operates on a strict 1-hour cycle (3600 seconds).
 * A slot only becomes active for nourishment once this 1 hour has finished.
 */
export function formatOneHourSlotCountdown(secondsDiff: number): {
  display: string; // e.g. "58:30"
  text: string; // e.g. "58m 30s left"
  isReadyForNourish: boolean; // 1 hour has completed!
  isOverdue: boolean;
  percentElapsed: number; // 0 to 100
  secondsLeft: number;
} {
  const isReady = secondsDiff <= 0;
  const isOverdue = secondsDiff < 0;

  if (isReady) {
    const overdueSeconds = Math.abs(secondsDiff);
    const ovMinutes = Math.floor(overdueSeconds / 60);
    const ovSecs = overdueSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      display: '00:00',
      text: overdueSeconds > 0 ? `+${pad(ovMinutes)}:${pad(ovSecs)} overdue` : '1 Hour Complete!',
      isReadyForNourish: true,
      isOverdue: overdueSeconds > 0,
      percentElapsed: 100,
      secondsLeft: 0,
    };
  }

  // Clamped to 3600 max (1 hour)
  const clampedSeconds = Math.min(secondsDiff, 3600);
  const minutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const display = `${pad(minutes)}:${pad(seconds)}`;
  const text = `${minutes}m ${pad(seconds)}s`;
  const percentElapsed = Math.min(100, Math.max(0, Math.round(((3600 - clampedSeconds) / 3600) * 100)));

  return {
    display,
    text,
    isReadyForNourish: false,
    isOverdue: false,
    percentElapsed,
    secondsLeft: clampedSeconds,
  };
}
