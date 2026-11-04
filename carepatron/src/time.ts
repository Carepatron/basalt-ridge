// Dates and times in the practice's time zone, without a date library.

import type { DateString } from './model';

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const utcNoon = (date: DateString) => new Date(`${date}T12:00:00Z`);

export function addDays(date: DateString, days: number): DateString {
  return new Date(utcNoon(date).getTime() + days * DAY).toISOString().slice(0, 10);
}

export const addMinutes = (instant: Date, minutes: number) => new Date(instant.getTime() + minutes * MINUTE);

/** 0 for Monday through 6 for Sunday. */
export const dayIndex = (date: DateString) => (utcNoon(date).getUTCDay() + 6) % 7;

/** The Monday on or before `date`. */
export const startOfWeek = (date: DateString) => addDays(date, -dayIndex(date));

/** A real calendar date, written `YYYY-MM-DD`: 2026-02-30 isn't one. */
export function isDate(text: string): boolean {
  const noon = utcNoon(text);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(noon.getTime()) && noon.toISOString().slice(0, 10) === text;
}

/** A time zone `Intl` knows, such as `America/Los_Angeles`. */
export function isTimeZone(name: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

/** How old someone born on `birth` is on `date`. */
export function ageOn(birth: DateString, date: DateString): number {
  const [year, month, day] = birth.split('-').map(Number);
  const [onYear, onMonth, onDay] = date.split('-').map(Number);
  return onYear - year - (onMonth < month || (onMonth === month && onDay < day) ? 1 : 0);
}

/** The calendar date of an instant, as seen in `timeZone`. */
export function localDate(instant: Date, timeZone: string): DateString {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/** The instant a wall-clock time happens in `timeZone`, daylight saving included. */
export function zonedInstant(date: DateString, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  const first = wallClock - offsetMinutes(wallClock, timeZone) * MINUTE;
  const second = wallClock - offsetMinutes(first, timeZone) * MINUTE;
  const shows = (instant: number) => instant + offsetMinutes(instant, timeZone) * MINUTE === wallClock;
  if (shows(second)) return new Date(second);
  if (shows(first)) return new Date(first);
  // The clocks jumped forward over this time, so it never happened: use the first moment after the jump.
  return new Date(Math.max(first, second));
}

/** The practice's calendar, counted in weeks from week 0. */
export interface Calendar {
  now: Date;
  today: DateString;
  timeZone: string;
  /** The date of a weekday, `week` weeks from week 0. */
  dateOf(week: number, day: Day): DateString;
  /** The instant of a wall-clock time on a date. */
  at(date: DateString, time: string): Date;
}

/** A calendar whose week 0 starts on `monday`: by default, the current week. */
export function calendar(now: Date, timeZone: string, monday = startOfWeek(localDate(now, timeZone))): Calendar {
  const today = localDate(now, timeZone);
  return {
    now,
    today,
    timeZone,
    dateOf: (week, day) => addDays(monday, week * 7 + DAYS.indexOf(day)),
    at: (date, time) => zonedInstant(date, time, timeZone),
  };
}

/** How far `timeZone` is ahead of UTC at an instant, in minutes. */
function offsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
  return Math.round((asUtc - instant) / MINUTE);
}
