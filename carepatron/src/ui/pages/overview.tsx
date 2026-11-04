import { addDays, startOfWeek, zonedInstant } from '../../time';
import { Card, Empty, PageHeader } from '../components';
import { Shell, type View } from '../layout';
import { Agenda, NotesTable, isClinician } from '../parts';

export function OverviewPage({ view }: { view: View }) {
  const { store, format: f, now, today } = view;
  const tz = store.practice.timezone;
  const monday = startOfWeek(today);
  const thisWeek = store.appointments({ from: zonedInstant(monday, '00:00', tz), to: zonedInstant(addDays(monday, 7), '00:00', tz) });
  const upNext = store.appointments({ from: now, status: 'scheduled' }).slice(0, 6);
  const drafts = store.notes({ status: 'draft' });
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Active clients', value: store.clients({ status: 'active' }).length, href: '/clients?status=active' },
    {
      label: 'Appointments this week',
      value: thisWeek.filter((a) => a.status === 'scheduled' || a.status === 'completed').length,
      href: '/appointments',
    },
    { label: 'Notes to sign', value: drafts.length, href: '/notes?status=draft' },
    { label: 'Clinicians', value: store.team.filter(isClinician).length, href: '/settings/team' },
  ];

  return (
    <Shell view={view} section="overview" title="Overview">
      <PageHeader title={greeting} subtitle={`${store.practice.name} · ${f.longDate(today)}`} />
      {store.isEmpty && (
        <section class="card welcome">
          <h2>Welcome to Carepatron</h2>
          <p>
            Your practice is empty: no clients, appointments or notes yet. Everything you add, or bring over from another platform, shows up
            here.
          </p>
        </section>
      )}
      <div class="stats">
        {stats.map((stat) => (
          <a class="card stat" href={stat.href}>
            <span class="stat-label">{stat.label}</span>
            <span class="stat-value">{stat.value}</span>
          </a>
        ))}
      </div>
      <div class="stack">
        <Card
          title="Up next"
          action={
            <a class="card-link" href="/appointments">
              Open calendar
            </a>
          }
          flush
        >
          {upNext.length ? <Agenda view={view} appointments={upNext} withDate /> : <Empty>Nothing booked.</Empty>}
        </Card>
        <Card
          title="Notes to sign"
          action={
            <a class="card-link" href="/notes?status=draft">
              All drafts
            </a>
          }
          flush
        >
          <NotesTable view={view} notes={drafts.slice(0, 6)} />
        </Card>
      </div>
    </Shell>
  );
}
