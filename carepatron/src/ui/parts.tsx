// Pieces shared by several pages: appointment lists and note tables.

import type { Appointment, Note, TeamMember } from '../model';
import { Avatar, Empty, Status } from './components';
import { APPOINTMENT_STATUS, NOTE_STATUS, clientName, memberName } from './format';
import { icons } from './icons';
import type { View } from './layout';

/** "1 client", "3 clients". */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Who an appointment is with: a client, a couple, or a group. Groups show their title and size. */
export function Attendees({ view, appointment }: { view: View; appointment: Appointment }) {
  const clients = appointment.clientIds.flatMap((id) => view.store.client(id) ?? []);
  if (clients.length > 2) {
    return (
      <span class="with-icon">
        {icons.group}
        <strong>{appointment.title ?? 'Group'}</strong>
        <span class="muted">· {plural(clients.length, 'client')}</span>
      </span>
    );
  }
  return (
    <span>
      {appointment.title && <strong>{appointment.title} · </strong>}
      {clients.length === 0 && <span class="muted">No client</span>}
      {clients.map((client, i) => (
        <>
          {i > 0 && ' & '}
          <a class="strong-link" href={`/clients/${client.id}`}>
            {clientName(client)}
          </a>
        </>
      ))}
    </span>
  );
}

/** Someone who sees clients: anyone active but the practice manager. */
export const isClinician = (member: TeamMember) => member.role !== 'practice_manager' && member.status === 'active';

/** A team member's name and credentials, or null when there's no one. */
export function personName(view: View, id: string | null): string | null {
  const member = id ? view.store.teamMember(id) : undefined;
  return member ? memberName(member) : null;
}

export function Clinician({ view, id }: { view: View; id: string }) {
  const member = view.store.teamMember(id);
  const hue =
    Math.max(
      0,
      view.store.team.findIndex((m) => m.id === id),
    ) % 6;
  return (
    <span class="with-icon">
      <span class={`dot hue-${hue}`} />
      {member ? memberName(member) : 'Unknown'}
    </span>
  );
}

export function Where({ view, id }: { view: View; id: string | null }) {
  const location = id ? view.store.location(id) : undefined;
  if (!location) return <span />;
  return (
    <span class="with-icon">
      {location.kind === 'telehealth' ? icons.video : icons.pin}
      {location.name}
    </span>
  );
}

/** A list of appointments, one row each. */
export function Agenda({ view, appointments, withDate = false }: { view: View; appointments: Appointment[]; withDate?: boolean }) {
  const { format: f, store } = view;
  return (
    <ul class="agenda">
      {appointments.map((appointment) => {
        const service = appointment.serviceId ? store.service(appointment.serviceId) : undefined;
        const minutes = Math.round((Date.parse(appointment.endsAt) - Date.parse(appointment.startsAt)) / 60_000);
        const what = [service?.name ?? 'Appointment', service?.cptCode, appointment.memo].filter(Boolean).join(' · ');
        return (
          <li class={appointment.status === 'cancelled' ? 'agenda-row cancelled' : 'agenda-row'}>
            <span class="agenda-time">
              {withDate ? f.shortDay(appointment.startsAt) : f.time(appointment.startsAt)}
              <small>{withDate ? `${f.time(appointment.startsAt)} · ${minutes} min` : `${minutes} min`}</small>
            </span>
            <span class="agenda-who">
              <Attendees view={view} appointment={appointment} />
              <small>{what}</small>
            </span>
            <Clinician view={view} id={appointment.clinicianId} />
            <Where view={view} id={appointment.locationId} />
            <span class="agenda-status">
              <Status map={APPOINTMENT_STATUS} value={appointment.status} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A table of notes, newest first. */
export function NotesTable({ view, notes, withClient = true }: { view: View; notes: Note[]; withClient?: boolean }) {
  const { format: f, store } = view;
  if (notes.length === 0) return <Empty>No notes here yet.</Empty>;
  return (
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          {withClient && <th>Client</th>}
          <th>Note</th>
          <th>Clinician</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {notes.map((note) => {
          const client = store.client(note.clientId);
          return (
            <tr>
              <td class="nowrap">
                <a class="row-link" href={`/notes/${note.id}`} aria-label={`${note.title}, ${f.date(note.dateOfService)}`} />
                {f.date(note.dateOfService)}
              </td>
              {withClient && (
                <td>
                  {client ? (
                    <span class="person">
                      <Avatar name={clientName(client)} seed={client.id} size="sm" />
                      {clientName(client)}
                    </span>
                  ) : (
                    <span class="muted">Unknown client</span>
                  )}
                </td>
              )}
              <td>
                <strong>{note.title}</strong>
                {note.template && note.template !== note.title && <span class="muted"> · {note.template}</span>}
              </td>
              <td class="nowrap">{personName(view, note.authorId) ?? 'Unknown'}</td>
              <td>
                <Status map={NOTE_STATUS} value={note.status} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
