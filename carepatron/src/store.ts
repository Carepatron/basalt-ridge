// The practice's data, and the only way to change it. The API and the web app
// both go through here, so every change is checked the same way before it
// reaches the database.

import { randomBytes } from 'node:crypto';
import type { z } from 'zod';
import type { Database } from './db';
import {
  PracticeFields,
  RESOURCES,
  createSchema,
  updateSchema,
  type Appointment,
  type AppointmentStatus,
  type Client,
  type ClientStatus,
  type Dataset,
  type Id,
  type Kind,
  type Note,
  type NoteStatus,
  type NoteType,
  type Practice,
  type Row,
} from './model';

/** A record that doesn't pass validation, with what's wrong with each field. */
export class Invalid extends Error {
  constructor(readonly issues: { path: string; message: string }[]) {
    super(issues.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message)).join('; '));
  }
}
export class NotFound extends Error {}
/** A change that would leave other records pointing at nothing. */
export class Conflict extends Error {}

export interface Page<T> {
  data: T[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
}

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    pagination: { page, perPage, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / perPage)) },
  };
}

export interface ClientQuery {
  search?: string;
  status?: ClientStatus;
}

export interface AppointmentQuery {
  clientId?: Id;
  clinicianId?: Id;
  status?: AppointmentStatus;
  /** Appointments starting at or after this instant. */
  from?: Date;
  /** Appointments starting before this instant. */
  to?: Date;
}

export interface NoteQuery {
  clientId?: Id;
  authorId?: Id;
  type?: NoteType;
  status?: NoteStatus;
}

const NAMES: Record<Kind, [one: string, many: string]> = {
  locations: ['location', 'locations'],
  services: ['service', 'services'],
  team: ['team member', 'team members'],
  payers: ['payer', 'payers'],
  clients: ['client', 'clients'],
  policies: ['insurance policy', 'insurance policies'],
  appointments: ['appointment', 'appointments'],
  notes: ['note', 'notes'],
};

const KINDS = Object.keys(RESOURCES) as Kind[];

/** The fields of a kind of record that point at other records, and what they point at. */
const referencesOf = (kind: Kind) => Object.entries(RESOURCES[kind].references) as [field: string, target: Kind][];

export type Store = ReturnType<typeof createStore>;

/** The practice in `db`. One that's never been set up starts as `start()`, and so does a reset. */
export function createStore(db: Database, start: () => Dataset) {
  if (!db.practice()) db.replace(start());

  const all = <K extends Kind>(kind: K) => db.table(kind).all() as Row<K>[];
  const get = <K extends Kind>(kind: K, id: Id) => db.table(kind).get(id) as Row<K> | undefined;
  const field = (row: object, name: string) => (row as Record<string, unknown>)[name];

  // ── Checks ─────────────────────────────────────────────────────────────────

  function parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (result.success) return result.data;
    throw new Invalid(result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })));
  }

  function mustExist(kind: Kind, id: unknown, path: string) {
    if (id !== null && !get(kind, id as Id)) throw new Invalid([{ path, message: `No ${NAMES[kind][0]} with ID ${id}` }]);
  }

  /** What makes a record valid beyond its own fields: what it points at exists, and a few rules. */
  function check(kind: Kind, row: Row<Kind>, before?: Row<Kind>) {
    for (const [name, target] of referencesOf(kind)) {
      const value = field(row, name);
      if (Array.isArray(value)) value.forEach((id, i) => mustExist(target, id, `${name}.${i}`));
      else mustExist(target, value, name);
    }
    switch (kind) {
      case 'team': {
        const [member, was] = [row as Row<'team'>, before as Row<'team'> | undefined];
        if (was?.role === 'owner' && (member.role !== 'owner' || member.status !== 'active'))
          throw new Invalid([{ path: 'role', message: 'The practice owner stays the owner, and active' }]);
        if (member.role === 'owner' && was?.role !== 'owner') throw new Invalid([{ path: 'role', message: 'A practice has one owner' }]);
        return;
      }
      case 'appointments': {
        const [appointment, was] = [row as Appointment, before as Appointment | undefined];
        if (appointment.endsAt <= appointment.startsAt) throw new Invalid([{ path: 'endsAt', message: 'Must be after startsAt' }]);
        // A client with notes on this appointment can't be taken off it.
        const removed = was?.clientIds.filter((id) => !appointment.clientIds.includes(id)) ?? [];
        const stranded = removed.length
          ? all('notes').filter((n) => n.appointmentId === appointment.id && removed.includes(n.clientId))
          : [];
        if (stranded.length)
          throw new Conflict(
            `${stranded.length} ${stranded.length === 1 ? 'note is' : 'notes are'} written for a client you're removing from this appointment. Change or delete them first.`,
          );
        return;
      }
      case 'notes': {
        const note = row as Note;
        if (note.appointmentId && !get('appointments', note.appointmentId)!.clientIds.includes(note.clientId))
          throw new Invalid([{ path: 'appointmentId', message: "That appointment isn't with this client" }]);
        return;
      }
    }
  }

  /** The records still pointing at this one, which have to change or go first. */
  function usedBy(kind: Kind, id: Id): string[] {
    return KINDS.flatMap((other) => {
      const names = referencesOf(other)
        .filter(([, target]) => target === kind)
        .map(([name]) => name);
      if (!names.length) return [];
      const count = all(other).filter((row) =>
        names.some((name) => {
          const value = field(row, name);
          return Array.isArray(value) ? value.includes(id) : value === id;
        }),
      ).length;
      return count ? [`${count} ${NAMES[other][count === 1 ? 0 : 1]}`] : [];
    });
  }

  function newId(kind: Kind): Id {
    for (;;) {
      const id = `${RESOURCES[kind].prefix}_${randomBytes(6).readUIntBE(0, 6).toString(36).padStart(10, '0').slice(-8)}`;
      if (!get(kind, id)) return id;
    }
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  const byName = (a: Client, b: Client) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);

  return {
    get practice(): Practice {
      return db.practice()!;
    },
    get locations() {
      return all('locations');
    },
    get services() {
      return all('services');
    },
    get team() {
      return all('team');
    },
    get payers() {
      return all('payers');
    },
    /** The person who signed up, and signs in. */
    get owner() {
      return all('team').find((member) => member.role === 'owner')!;
    },
    /** True until anything has been added to the practice. */
    get isEmpty() {
      return KINDS.every((kind) => kind === 'team' || !db.table(kind).count());
    },

    get,
    client: (id: Id) => get('clients', id),
    teamMember: (id: Id) => get('team', id),
    service: (id: Id) => get('services', id),
    location: (id: Id) => get('locations', id),
    appointment: (id: Id) => get('appointments', id),
    note: (id: Id) => get('notes', id),

    /** Sorted by last name. `search` matches names, emails and phone numbers. */
    clients({ search, status }: ClientQuery = {}): Client[] {
      const needle = fold(search ?? '');
      return all('clients')
        .filter((client) => (!status || client.status === status) && (!needle || matches(client, needle)))
        .sort(byName);
    },

    policies: (clientId?: Id) => all('policies').filter((policy) => !clientId || policy.clientId === clientId),

    /** Sorted by start time. */
    appointments({ clientId, clinicianId, status, from, to }: AppointmentQuery = {}): Appointment[] {
      const after = from?.toISOString();
      const before = to?.toISOString();
      return all('appointments')
        .filter(
          (a) =>
            (!clientId || a.clientIds.includes(clientId)) &&
            (!clinicianId || a.clinicianId === clinicianId) &&
            (!status || a.status === status) &&
            (!after || a.startsAt >= after) &&
            (!before || a.startsAt < before),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },

    /** Newest first. */
    notes({ clientId, authorId, type, status }: NoteQuery = {}): Note[] {
      return all('notes')
        .filter(
          (note) =>
            (!clientId || note.clientId === clientId) &&
            (!authorId || note.authorId === authorId) &&
            (!type || note.type === type) &&
            (!status || note.status === status),
        )
        .sort((a, b) => b.dateOfService.localeCompare(a.dateOfService) || b.createdAt.localeCompare(a.createdAt));
    },

    // ── Changing ─────────────────────────────────────────────────────────────

    create<K extends Kind>(kind: K, body: unknown): Row<K> {
      const input = parse(createSchema(kind), body);
      const row = { id: newId(kind), ...RESOURCES[kind].defaults(), ...input } as unknown as Row<K>;
      check(kind, row as Row<Kind>);
      db.table(kind).insert(row);
      return row;
    },

    update<K extends Kind>(kind: K, id: Id, body: unknown): Row<K> {
      const before = get(kind, id);
      if (!before) throw new NotFound(`No ${NAMES[kind][0]} with ID ${id}.`);
      const row = { ...before, ...parse(updateSchema(kind), body), id } as Row<K>;
      check(kind, row as Row<Kind>, before as Row<Kind>);
      db.table(kind).update(row);
      return row;
    },

    remove(kind: Kind, id: Id) {
      const row = get(kind, id);
      if (!row) throw new NotFound(`No ${NAMES[kind][0]} with ID ${id}.`);
      if (kind === 'team' && (row as Row<'team'>).role === 'owner') throw new Conflict("The practice owner can't be removed.");
      const users = usedBy(kind, id);
      if (users.length) throw new Conflict(`This ${NAMES[kind][0]} is still used by ${users.join(', ')}. Change or delete those first.`);
      db.table(kind).remove(id);
    },

    updatePractice(body: unknown): Practice {
      const practice = { ...db.practice()!, ...parse(PracticeFields.partial().strict(), body) };
      db.savePractice(practice);
      return practice;
    },

    /** Back to how the practice started. */
    reset() {
      db.replace(start());
    },
  };
}

/** Lower case, without accents, so "sofia" finds Sofía. */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const digits = (text: string | null) => (text ?? '').replace(/\D/g, '');

function matches(client: Client, needle: string): boolean {
  const names = [
    `${client.firstName} ${client.lastName}`,
    client.preferredName && `${client.preferredName} ${client.lastName}`,
    client.email,
  ];
  if (names.some((name) => name && fold(name).includes(needle))) return true;
  // A search that looks like a phone number also matches phone numbers, whatever their format.
  const number = digits(needle);
  return /^[\d\s()+.-]+$/.test(needle) && number.length >= 3 && digits(client.phone).includes(number);
}
