// Appointments: every booking on the roster, played out week by week.

import type { Appointment, AppointmentStatus, DateString } from '../model';
import { clientId } from './clients';
import { locations, services, team, type ClinicianKey, type LocationKey, type ServiceKey } from './practice';
import { random, stableId } from './random';
import { GROUP, ROSTER } from './roster';
import { addMinutes, type Calendar, type Day } from '../time';

/** How far ahead the calendar is booked. */
export const WEEKS_AHEAD = 4;

const BYDAY: Record<Day, string> = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };

const MEMOS: Partial<Record<AppointmentStatus, string[]>> = {
  cancelled: [
    'Client cancelled: unwell',
    'Client cancelled: work conflict',
    'Rescheduled at client request',
    'Clinician cancelled: illness',
    'Client cancelled: travelling',
  ],
  late_cancelled: ['Cancelled with less than 24 hours notice; late cancellation fee applies', 'Late cancellation: childcare fell through'],
  no_show: ['No-show; left a voicemail', 'No-show; sent a text to reschedule'],
};

interface Slot {
  key: string;
  date: DateString;
  time: string;
  clinician: ClinicianKey;
  service: ServiceKey;
  location: LocationKey;
  clients: string[];
  series?: { id: string; rule: string };
  title?: string;
  memo?: string;
  /** Intakes, consultations and groups go ahead as planned. */
  certain?: boolean;
}

export function buildAppointments(cal: Calendar): Appointment[] {
  const slots: Slot[] = [];

  for (const persona of ROSTER) {
    persona.bookings?.forEach((booking, index) => {
      const intake = booking.intake ?? index === 0;
      const weeks: number[] = [];
      for (let week = booking.from; week < (booking.until ?? WEEKS_AHEAD + 1); week += booking.every) weeks.push(week);
      // A series that has stopped says when: the start of its last appointment, in UTC.
      const last = weeks[weeks.length - 1];
      const until = booking.until === undefined ? '' : `;UNTIL=${compact(cal.at(cal.dateOf(last, booking.day), booking.time))}`;
      const series = {
        id: stableId('ser', `${persona.key}:${index}`),
        rule: `FREQ=WEEKLY;INTERVAL=${booking.every};BYDAY=${BYDAY[booking.day]}${until}`,
      };
      for (const week of weeks) {
        const first = week === booking.from;
        slots.push({
          key: `${persona.key}:${index}:${week}`,
          date: cal.dateOf(week, booking.day),
          time: booking.time,
          clinician: booking.clinician,
          service: first && intake ? 'intake' : booking.service,
          location: booking.location,
          clients: [persona.key, ...(booking.with ?? [])],
          // The first appointment is booked on its own; the repeating series follows it.
          series: first && intake ? undefined : series,
          memo: booking.memo,
          certain: first && intake,
        });
      }
    });

    persona.oneOffs?.forEach((once, index) => {
      slots.push({
        key: `${persona.key}:once:${index}`,
        date: cal.dateOf(once.week, once.day),
        time: once.time,
        clinician: once.clinician,
        service: once.service,
        location: once.location,
        clients: [persona.key],
        memo: once.memo,
        certain: true,
      });
    });
  }

  for (let week = GROUP.from; week <= WEEKS_AHEAD; week++) {
    const date = cal.dateOf(week, GROUP.day);
    const finished = addMinutes(cal.at(date, GROUP.time), services[GROUP.service].durationMinutes) <= cal.now;
    const members = Object.keys(GROUP.members).filter((key) => GROUP.members[key] <= week);
    // A past session lists who came; a future one, everyone expected.
    const attended = finished ? members.filter((key) => random(`group:${week}:${key}`).chance(0.85)) : members;
    slots.push({
      key: `group:${week}`,
      date,
      time: GROUP.time,
      clinician: GROUP.clinician,
      service: GROUP.service,
      location: GROUP.location,
      clients: attended,
      series: { id: stableId('ser', 'group'), rule: `FREQ=WEEKLY;BYDAY=${BYDAY[GROUP.day]}` },
      title: GROUP.title,
      certain: true,
    });
  }

  return slots.map((slot) => toAppointment(slot, cal)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function toAppointment(slot: Slot, cal: Calendar): Appointment {
  const startsAt = cal.at(slot.date, slot.time);
  const endsAt = addMinutes(startsAt, services[slot.service].durationMinutes);
  const rng = random(`appointment:${slot.key}`);
  const status = statusOf(rng.next(), endsAt <= cal.now, slot.certain ?? false);
  const reason = MEMOS[status] ? rng.pick(MEMOS[status]!) : null;

  return {
    id: stableId('appt', slot.key),
    title: slot.title ?? null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status,
    clientIds: slot.clients.map(clientId),
    clinicianId: team[slot.clinician].id,
    serviceId: services[slot.service].id,
    locationId: locations[slot.location].id,
    seriesId: slot.series?.id ?? null,
    recurrence: slot.series?.rule ?? null,
    memo: [slot.memo, reason].filter(Boolean).join('. ') || null,
  };
}

/** An instant the way RFC 5545 writes it: 20261104T170000Z. */
const compact = (instant: Date) =>
  instant
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

function statusOf(roll: number, past: boolean, certain: boolean): AppointmentStatus {
  if (!past) return !certain && roll < 0.03 ? 'cancelled' : 'scheduled';
  if (certain || roll < 0.86) return 'completed';
  if (roll < 0.92) return 'cancelled';
  if (roll < 0.96) return 'late_cancelled';
  return 'no_show';
}
