import type { DateString } from '../../model';
import { addDays, localDate, zonedInstant } from '../../time';
import { Badge, PageHeader, Segmented, withQuery } from '../components';
import { icons } from '../icons';
import { Shell, type View } from '../layout';
import { Agenda, isClinician, plural } from '../parts';

export function AppointmentsPage({ view, week, clinicianId }: { view: View; week: DateString; clinicianId?: string }) {
  const { store, format: f, url, today } = view;
  const tz = store.practice.timezone;
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const appointments = store.appointments({
    from: zonedInstant(week, '00:00', tz),
    to: zonedInstant(addDays(week, 7), '00:00', tz),
    clinicianId,
  });
  const on = (day: DateString) => appointments.filter((a) => localDate(new Date(a.startsAt), tz) === day);
  const clinicians = store.team.filter(isClinician);
  const sunday = days[6];

  return (
    <Shell view={view} section="appointments" title="Appointments">
      <PageHeader
        title="Appointments"
        subtitle={`${f.monthDay(week)} – ${f.monthDay(sunday)}, ${sunday.slice(0, 4)} · ${plural(appointments.length, 'appointment')}`}
        actions={
          <div class="week-nav">
            <a class="button icon" href={withQuery(url, { week: addDays(week, -7) })} aria-label="Previous week">
              {icons.left}
            </a>
            <a class="button" href={withQuery(url, { week: null })}>
              This week
            </a>
            <a class="button icon" href={withQuery(url, { week: addDays(week, 7) })} aria-label="Next week">
              {icons.right}
            </a>
          </div>
        }
      />
      <div class="toolbar">
        <Segmented
          items={[
            { label: 'Everyone', href: withQuery(url, { clinician: null }), active: !clinicianId },
            ...clinicians.map((member) => ({
              label: `${member.firstName} ${member.lastName}`,
              href: withQuery(url, { clinician: member.id }),
              active: clinicianId === member.id,
            })),
          ]}
        />
      </div>
      {days.map((day, i) => {
        const list = on(day);
        // Weekends only show up when something is booked on them.
        if (i >= 5 && list.length === 0) return null;
        return (
          <section class="day">
            <h2 class="day-title">
              {f.weekday(day)} <span class="muted">{f.monthDay(day)}</span>
              {day === today && <Badge tone="green">Today</Badge>}
            </h2>
            {list.length ? (
              <div class="card flush">
                <Agenda view={view} appointments={list} />
              </div>
            ) : (
              <p class="day-empty">No appointments</p>
            )}
          </section>
        );
      })}
    </Shell>
  );
}
