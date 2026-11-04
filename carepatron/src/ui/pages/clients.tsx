import type { ClientStatus } from '../../model';
import { paginate } from '../../store';
import { Avatar, Empty, PageHeader, Pagination, Segmented, Status, withQuery } from '../components';
import { ageOn } from '../../time';
import { CLIENT_STATUS, clientName } from '../format';
import { icons } from '../icons';
import { Shell, type View } from '../layout';
import { personName, plural } from '../parts';

const PER_PAGE = 20;

export function ClientsPage({ view, search, status, page }: { view: View; search: string; status?: ClientStatus; page: number }) {
  const { store, format: f, url, now, today } = view;
  const found = store.clients({ search });
  const shown = status ? found.filter((client) => client.status === status) : found;
  const current = Math.min(page, Math.max(1, Math.ceil(shown.length / PER_PAGE)));
  const { data } = paginate(shown, current, PER_PAGE);
  const count = (s?: ClientStatus) => (s ? found.filter((client) => client.status === s).length : found.length);
  const filters: [ClientStatus | undefined, string][] = [
    [undefined, 'All'],
    ['active', 'Active'],
    ['inactive', 'Inactive'],
    ['discharged', 'Discharged'],
  ];

  return (
    <Shell view={view} section="clients" title="Clients">
      <PageHeader title="Clients" subtitle={`${plural(store.clients().length, 'client')} at ${store.practice.name}`} />
      <div class="toolbar">
        <form class="search" method="get" action="/clients" role="search">
          {icons.search}
          <input
            class="input"
            type="search"
            name="search"
            value={search}
            placeholder="Search by name, email or phone"
            aria-label="Search clients"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <Segmented
          items={filters.map(([value, label]) => ({
            label,
            count: count(value),
            href: withQuery(url, { status: value ?? null, page: null }),
            active: status === value,
          }))}
        />
      </div>
      <section class="card flush">
        {data.length === 0 ? (
          <Empty>{search ? `No clients match “${search}”.` : 'No clients here.'}</Empty>
        ) : (
          <table class="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Date of birth</th>
                <th>Phone</th>
                <th>Clinician</th>
                <th>Next appointment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((client) => {
                const next = store.appointments({ clientId: client.id, from: now, status: 'scheduled' })[0];
                return (
                  <tr>
                    <td>
                      <a class="row-link person" href={`/clients/${client.id}`}>
                        <Avatar name={clientName(client)} seed={client.id} />
                        <span>
                          <strong>{clientName(client)}</strong>
                          <small>{client.email ?? 'No email'}</small>
                        </span>
                      </a>
                    </td>
                    <td class="nowrap">
                      {client.dateOfBirth ? (
                        <>
                          {f.date(client.dateOfBirth)} <span class="muted">· {ageOn(client.dateOfBirth, today)}</span>
                        </>
                      ) : (
                        <span class="muted">Not set</span>
                      )}
                    </td>
                    <td class="nowrap">{client.phone ?? <span class="muted">Not set</span>}</td>
                    <td>{personName(view, client.primaryClinicianId) ?? <span class="muted">Not assigned</span>}</td>
                    <td class="nowrap">{next ? f.dateTime(next.startsAt) : <span class="muted">None</span>}</td>
                    <td>
                      <Status map={CLIENT_STATUS} value={client.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <Pagination page={current} perPage={PER_PAGE} total={shown.length} href={(p) => withQuery(url, { page: p === 1 ? null : p })} />
    </Shell>
  );
}
