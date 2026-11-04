import { raw } from 'hono/html';
import type { Note, NoteType } from '../../model';
import { paginate } from '../../store';
import { Card, Field, Fields, PageHeader, Pagination, Segmented, Status, withQuery } from '../components';
import { NOTE_STATUS, NOTE_TYPE, clientName } from '../format';
import { Shell, type View } from '../layout';
import { NotesTable, personName } from '../parts';
import { safeHtml } from '../sanitize';

const PER_PAGE = 25;

export function NotesPage({ view, status, type, page }: { view: View; status?: Note['status']; type?: NoteType; page: number }) {
  const { store, url } = view;
  const ofType = store.notes({ type });
  const shown = status ? ofType.filter((note) => note.status === status) : ofType;
  const types = Object.entries(NOTE_TYPE) as [NoteType, string][];
  const current = Math.min(page, Math.max(1, Math.ceil(shown.length / PER_PAGE)));

  return (
    <Shell view={view} section="notes" title="Notes">
      <PageHeader title="Notes" subtitle={`${store.notes().length} notes and documents`} />
      <div class="toolbar">
        <Segmented
          items={[
            { label: 'All types', href: withQuery(url, { type: null, page: null }), active: !type },
            ...types.map(([value, label]) => ({ label, href: withQuery(url, { type: value, page: null }), active: type === value })),
          ]}
        />
        <Segmented
          items={[
            { label: 'All', count: ofType.length, href: withQuery(url, { status: null, page: null }), active: !status },
            ...(['draft', 'signed'] as const).map((value) => ({
              label: NOTE_STATUS[value][0],
              count: ofType.filter((note) => note.status === value).length,
              href: withQuery(url, { status: value, page: null }),
              active: status === value,
            })),
          ]}
        />
      </div>
      <section class="card flush">
        <NotesTable view={view} notes={paginate(shown, current, PER_PAGE).data} />
      </section>
      <Pagination page={current} perPage={PER_PAGE} total={shown.length} href={(p) => withQuery(url, { page: p === 1 ? null : p })} />
    </Shell>
  );
}

export function NotePage({ view, note }: { view: View; note: Note }) {
  const { store, format: f } = view;
  const client = store.client(note.clientId);
  const name = client ? clientName(client) : 'Unknown client';
  const author = personName(view, note.authorId) ?? 'Unknown';
  const appointment = note.appointmentId ? store.appointment(note.appointmentId) : undefined;
  const service = appointment?.serviceId ? store.service(appointment.serviceId) : undefined;

  return (
    <Shell view={view} section="notes" title={`${note.title} · ${name}`}>
      <PageHeader
        back={client ? { href: `/clients/${client.id}/notes`, label: name } : { href: '/notes', label: 'Notes' }}
        title={note.title}
        subtitle={`${f.date(note.dateOfService)} · ${author}`}
        actions={<Status map={NOTE_STATUS} value={note.status} />}
      />
      <div class="note-layout">
        <article class="card prose">{raw(safeHtml(note.content))}</article>
        <Card title="About this note">
          <Fields>
            <Field label="Client">
              {client ? (
                <a class="strong-link" href={`/clients/${client.id}`}>
                  {name}
                </a>
              ) : (
                name
              )}
            </Field>
            <Field label="Type">{NOTE_TYPE[note.type] ?? note.type}</Field>
            <Field label="Template">{note.template}</Field>
            <Field label="Date of service">{f.date(note.dateOfService)}</Field>
            {appointment && (
              <Field label="Appointment">
                {f.dateTime(appointment.startsAt)}
                {service && <small class="block muted">{[service.name, service.cptCode].filter(Boolean).join(' · ')}</small>}
              </Field>
            )}
            <Field label="Written by">{author}</Field>
            <Field label="Signed">
              {note.signedAt ? (
                f.dateTime(note.signedAt)
              ) : (
                <span class="muted">{note.status === 'signed' ? 'Time not recorded' : 'Not signed yet'}</span>
              )}
            </Field>
          </Fields>
        </Card>
      </div>
    </Shell>
  );
}
