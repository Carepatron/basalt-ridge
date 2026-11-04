// How things read on screen. Times show in the practice's time zone.

import type { AppointmentStatus, Client, ClientStatus, DateString, Note, NoteType, TeamMember, Timestamp } from '../model';
import type { Tone } from './components';

export type Format = ReturnType<typeof createFormat>;

export function createFormat(timeZone: string, currency: string) {
  // A value that isn't a real date or time, such as one written straight into the database, shows as it is.
  const show = (format: Intl.DateTimeFormat, read: (value: string) => Date) => (value: string) => {
    const date = read(value);
    return Number.isNaN(date.getTime()) ? String(value) : format.format(date);
  };
  const zoned = (options: Intl.DateTimeFormatOptions) =>
    show(new Intl.DateTimeFormat('en-US', { timeZone, ...options }), (at: Timestamp) => new Date(at));
  // Calendar dates have no time zone: read them at noon UTC and print them in UTC.
  const calendar = (options: Intl.DateTimeFormatOptions) =>
    show(new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }), (date: DateString) => new Date(`${date}T12:00:00Z`));
  const whole = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });

  return {
    /** Mar 14, 1991 */
    date: calendar({ month: 'short', day: 'numeric', year: 'numeric' }),
    /** Monday */
    weekday: calendar({ weekday: 'long' }),
    /** November 4 */
    monthDay: calendar({ month: 'long', day: 'numeric' }),
    /** Wednesday, November 4 */
    longDate: calendar({ weekday: 'long', month: 'long', day: 'numeric' }),
    /** 2:00 PM */
    time: zoned({ hour: 'numeric', minute: '2-digit' }),
    /** Wed, Nov 4, 2:00 PM */
    dateTime: zoned({ weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    /** Nov 4, 2026, for an instant */
    day: zoned({ month: 'short', day: 'numeric', year: 'numeric' }),
    /** Wed, Nov 4, for an instant */
    shortDay: zoned({ weekday: 'short', month: 'short', day: 'numeric' }),
    /** $165, or $142.50, in the practice's currency */
    money: (amount: number) => (Number.isInteger(amount) ? whole : cents).format(amount),
  };
}

export const clientName = (client: Client) => `${client.preferredName ?? client.firstName} ${client.lastName}`;
export const legalName = (client: Client) => `${client.firstName} ${client.lastName}`;
export const memberName = (member: TeamMember) =>
  `${member.firstName} ${member.lastName}${member.credentials ? `, ${member.credentials}` : ''}`;

export const CLIENT_STATUS: Record<ClientStatus, [label: string, tone: Tone]> = {
  active: ['Active', 'green'],
  inactive: ['Inactive', 'gray'],
  discharged: ['Discharged', 'violet'],
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, [label: string, tone: Tone]> = {
  scheduled: ['Scheduled', 'blue'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'gray'],
  late_cancelled: ['Late cancel', 'amber'],
  no_show: ['No-show', 'red'],
};

export const NOTE_STATUS: Record<Note['status'], [label: string, tone: Tone]> = {
  signed: ['Signed', 'green'],
  draft: ['Draft', 'amber'],
};

export const NOTE_TYPE: Record<NoteType, string> = {
  intake: 'Intake',
  progress: 'Progress',
  treatment_plan: 'Treatment plan',
  contact: 'Contact',
  discharge: 'Discharge',
};

export const ROLE: Record<TeamMember['role'], string> = {
  owner: 'Owner',
  clinician: 'Clinician',
  practice_manager: 'Practice manager',
};
