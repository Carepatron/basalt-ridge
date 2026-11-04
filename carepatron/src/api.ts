// The JSON API, mounted at /api/v1. Everything except signing in needs a token.

import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { AppEnv, Auth } from './auth';
import {
  AppointmentStatus,
  ClientStatus,
  NoteStatus,
  NoteType,
  PracticeFields,
  RESOURCES,
  createSchema,
  updateSchema,
  type Kind,
} from './model';
import { Invalid, paginate, type Store } from './store';
import { isDate, zonedInstant } from './time';

const KINDS = Object.keys(RESOURCES) as Kind[];
/** Every kind of record, as one path: /api/v1/{locations,services,…}. */
const ANY = `/api/v1/{${KINDS.map((kind) => RESOURCES[kind].path).join(',')}}`;

const INDEX = {
  name: 'Carepatron API (mock)',
  version: 'v1',
  authentication: 'POST /api/v1/auth/login with {"email", "password"}, then send "Authorization: Bearer <token>".',
  reading: {
    'GET /api/v1/me': 'The signed-in user: the practice owner.',
    'GET /api/v1/practice': 'Practice details.',
    'GET /api/v1/locations': 'Offices and telehealth.',
    'GET /api/v1/services': 'Services offered, with CPT codes and fees.',
    'GET /api/v1/team': 'Clinicians and staff.',
    'GET /api/v1/payers': 'Insurance companies the practice bills.',
    'GET /api/v1/clients': 'Clients, by last name. Filters: search, status. Paginated.',
    'GET /api/v1/insurance-policies': "Clients' insurance policies. Filter: clientId. Paginated.",
    'GET /api/v1/appointments': 'Appointments, by start time. Filters: from, to, clientId, clinicianId, status. Paginated.',
    'GET /api/v1/notes': 'Notes, newest first, without their content. Filters: clientId, authorId, type, status. Paginated.',
    [`GET ${ANY}/:id`]: 'One record. A note comes with its content.',
  },
  writing: {
    'PATCH /api/v1/practice': 'Change practice details.',
    [`POST ${ANY}`]: 'Create a record. Returns it, with its ID.',
    [`PATCH ${ANY}/:id`]: "Change some of a record's fields.",
    [`DELETE ${ANY}/:id`]: 'Delete a record that nothing else uses.',
    'GET /api/v1/schema': 'What each of these accepts, as JSON Schema.',
    'POST /api/v1/reset': 'Mock only: empty the practice and start again.',
  },
  pagination: 'Paginated lists take ?page= and ?perPage= (default 25, max 100) and return { data, pagination }.',
  dates:
    'Timestamps are UTC. from and to take a date (2026-11-04, meaning midnight at the practice) or a timestamp with a time zone; from is inclusive, to is exclusive.',
  errors:
    '{ error: { code, message } }. 400 for an invalid request (with issues per field), 401, 404, and 409 when something else still uses a record.',
};

const schema = (type: z.ZodType) => z.toJSONSchema(type, { io: 'input', unrepresentable: 'any' });

/** The schema for creating a record, showing what each field left out defaults to. */
function creating(kind: Kind) {
  const json = schema(createSchema(kind)) as { properties: Record<string, object> };
  for (const [field, value] of Object.entries(RESOURCES[kind].defaults())) {
    const fallback = field === 'createdAt' ? { description: 'Defaults to the time the record is created.' } : { default: value };
    json.properties[field] = { ...json.properties[field], ...fallback };
  }
  return json;
}

const SCHEMA = {
  practice: { update: schema(PracticeFields.partial().strict()) },
  ...Object.fromEntries(KINDS.map((kind) => [RESOURCES[kind].path, { create: creating(kind), update: schema(updateSchema(kind)) }])),
};

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** A request we can't answer as asked. Becomes a 400. */
export class BadRequest extends Error {}

export function api(store: Store, auth: Auth) {
  const app = new Hono<AppEnv>({ strict: false });

  app.get('/', (c) => c.json(INDEX));

  app.post('/auth/login', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const { email, password } = (body && typeof body === 'object' ? body : {}) as { email?: unknown; password?: unknown };
    const session = typeof email === 'string' && typeof password === 'string' ? auth.signIn(email, password) : null;
    if (!session) return c.json({ error: { code: 'invalid_credentials', message: 'Email or password is incorrect.' } }, 401);
    return c.json({ token: session.token, tokenType: 'Bearer', expiresAt: session.expiresAt, user: session.user });
  });

  // Everything below needs a signed-in user.
  app.use('*', auth.api);

  app.get('/me', (c) => c.json(c.get('user')));
  app.get('/schema', (c) => c.json(SCHEMA));
  app.get('/practice', (c) => c.json(store.practice));
  app.patch('/practice', async (c) => c.json(store.updatePractice(await body(c))));
  app.post('/reset', (c) => {
    store.reset();
    return c.json(store.practice);
  });

  // Lists, with their filters.
  app.get('/locations', (c) => c.json({ data: store.locations }));
  app.get('/services', (c) => c.json({ data: store.services }));
  app.get('/team', (c) => c.json({ data: store.team }));
  app.get('/payers', (c) => c.json({ data: store.payers }));

  app.get('/clients', (c) => {
    const q = query(c, store.practice.timezone);
    const clients = store.clients({ search: q.text('search'), status: q.oneOf('status', ClientStatus.options) });
    return c.json(paginate(clients, ...q.page()));
  });

  app.get('/insurance-policies', (c) => {
    const q = query(c, store.practice.timezone);
    return c.json(paginate(store.policies(q.text('clientId')), ...q.page()));
  });

  app.get('/appointments', (c) => {
    const q = query(c, store.practice.timezone);
    const appointments = store.appointments({
      from: q.date('from'),
      to: q.date('to'),
      clientId: q.text('clientId'),
      clinicianId: q.text('clinicianId'),
      status: q.oneOf('status', AppointmentStatus.options),
    });
    return c.json(paginate(appointments, ...q.page()));
  });

  app.get('/notes', (c) => {
    const q = query(c, store.practice.timezone);
    const notes = store.notes({
      clientId: q.text('clientId'),
      authorId: q.text('authorId'),
      type: q.oneOf('type', NoteType.options),
      status: q.oneOf('status', NoteStatus.options),
    });
    return c.json(
      paginate(
        notes.map(({ content, ...summary }) => summary),
        ...q.page(),
      ),
    );
  });

  // One record of any kind: read, create, change, delete.
  for (const kind of KINDS) {
    const path = `/${RESOURCES[kind].path}`;
    app.get(`${path}/:id`, (c) => {
      const row = store.get(kind, c.req.param('id'));
      return row ? c.json(row) : c.json({ error: { code: 'not_found', message: `Nothing at ${c.req.path}.` } }, 404);
    });
    app.post(path, async (c) => c.json(store.create(kind, await body(c)), 201));
    app.patch(`${path}/:id`, async (c) => c.json(store.update(kind, c.req.param('id'), await body(c))));
    app.delete(`${path}/:id`, (c) => {
      store.remove(kind, c.req.param('id'));
      return c.body(null, 204);
    });
  }

  return app;
}

/** The request's JSON body. */
async function body(c: Context): Promise<unknown> {
  const invalid = new Invalid([{ path: '', message: 'Expected a JSON body, sent with "Content-Type: application/json"' }]);
  if (!c.req.header('content-type')?.toLowerCase().startsWith('application/json')) throw invalid;
  return c.req.json().catch(() => {
    throw invalid;
  });
}

/** Reads and checks query parameters. */
function query(c: Context, timeZone: string) {
  const text = (name: string) => c.req.query(name)?.trim() || undefined;
  const int = (name: string, fallback: number, max: number) => {
    const value = text(name);
    if (value === undefined) return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > max) throw new BadRequest(`${name} must be a whole number from 1 to ${max}.`);
    return number;
  };

  return {
    text,
    oneOf<T extends string>(name: string, allowed: readonly T[]): T | undefined {
      const value = text(name);
      if (value !== undefined && !allowed.includes(value as T)) throw new BadRequest(`${name} must be one of: ${allowed.join(', ')}.`);
      return value as T | undefined;
    },
    /** A date (midnight at the practice) or a timestamp with its time zone. */
    date(name: string): Date | undefined {
      const value = text(name);
      if (value === undefined) return undefined;
      if (isDate(value)) return zonedInstant(value, '00:00', timeZone);
      const instant = TIMESTAMP.test(value) ? new Date(value) : null;
      if (!instant || Number.isNaN(instant.getTime()) || !isDate(value.slice(0, 10))) {
        throw new BadRequest(`${name} must be a date (2026-11-04) or a timestamp with a time zone (2026-11-04T17:00:00Z).`);
      }
      return instant;
    },
    page: (): [page: number, perPage: number] => [int('page', 1, 10_000), int('perPage', 25, 100)],
  };
}
