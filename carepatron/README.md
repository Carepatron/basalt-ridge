# Carepatron (mock)

A small mock of Carepatron: the app your tool moves a practice into. It has a web app and a JSON API, and runs on your machine.

```bash
npm install
npm start        # your practice, at http://localhost:4000
npm run demo     # a practice that's already set up, at http://localhost:4001
```

It needs Node.js 24 or later. Set `PORT` to use a different port. Sign in to either with `you@practice.example` and `carepatron`.

## Your practice

`npm start` opens your practice. It starts empty, with just the practice and its owner (the account you sign in with), and fills up as your tool moves things in. To start again, use **Settings › Start over**, or `POST /api/v1/reset`.

Everything is kept in a SQLite database, `.data/carepatron.db`, so it's still there after a restart, and you can check a migration with `sqlite3` or any SQLite app. Each kind of record has a table (`clients`, `insurance_policies`, `appointments`, `notes`…) with a column for each field, so `firstName` is `first_name`. Lists and nested details, such as an address, are stored as JSON. References are foreign keys, apart from an appointment's `client_ids`, which is a JSON list.

```bash
sqlite3 .data/carepatron.db "SELECT first_name, last_name, date_of_birth FROM clients"
```

`npm run demo` opens Lakeshore Therapy Group: a fictional practice with 37 clients, about 420 appointments, about 340 notes, their insurance, and its full settings. It shows what a practice looks like once it's set up. It lives in memory, so you can change it, but it's rebuilt every time it starts, and your own practice isn't touched.

## The API

Sign in to get a token:

```bash
curl -s http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@practice.example", "password": "carepatron"}'
```

Send it with every request as `Authorization: Bearer <token>`, and send bodies as JSON with `Content-Type: application/json`. `GET /api/v1` lists every endpoint, and `GET /api/v1/schema` describes every record as JSON Schema: what each field means, which are required, and what the rest default to.

| | Collections |
| --- | --- |
| **Practice** | `/api/v1/practice`: one record, which you `GET` and `PATCH` |
| **Settings** | `/api/v1/locations`, `/api/v1/services`, `/api/v1/team`, `/api/v1/payers` |
| **Clients** | `/api/v1/clients`, `/api/v1/insurance-policies` |
| **Care** | `/api/v1/appointments`, `/api/v1/notes` |

Every collection works the same way. `GET` it to list, and `POST` to it to create. For one record, `GET`, `PATCH` or `DELETE` its `/:id`. A `PATCH` changes only the fields you send.

**Lists.** Clients, insurance policies, appointments and notes come in pages: `?page=` and `?perPage=` (25 by default, 100 at most), returning `{ data, pagination }`. The settings lists return everything as `{ data }`. Note lists leave out each note's content; get the note by ID for it.

**Filters.** Clients take `search` and `status`. Insurance policies take `clientId`. Appointments take `from`, `to`, `clientId`, `clinicianId` and `status`; `from` and `to` take a date (midnight at the practice) or a timestamp, and `to` is exclusive. Notes take `clientId`, `authorId`, `type` and `status`.

**Rules.**

- The mock makes the IDs.
- Everything a record points at has to exist first: a client's clinician, an appointment's clients, clinician, service and location, a note's client, author and appointment. A note's appointment has to include its client.
- Timestamps need seconds and a time zone (`2026-11-10T15:00:00-05:00`), and come back in UTC. Dates look like `2026-11-10`.
- A note's content is HTML or plain text.
- A practice has one owner, who can't be removed. A record that something else still uses can't be deleted either; the error says what's using it.
- Errors look like `{ error: { code, message } }`, with a 400 for a request that doesn't validate (its `issues` list what's wrong with each field), 401, 404, or 409 for a clash.

## How it's built

TypeScript on [Hono](https://hono.dev), with pages rendered on the server from JSX, every record described by a [zod](https://zod.dev) schema, and SQLite, which is built into Node. There's nothing else to install and no build step.

```
src/
├── server.ts          Starts the mock, with your practice or the demo
├── app.ts             Puts the API and the web app together
├── auth.ts            The login, sessions and tokens
├── api.ts             The JSON API
├── model.ts           Every record, as a zod schema
├── store.ts           Reads and changes the practice, and checks every change
├── db.ts              The SQLite database, with tables made from the schemas
├── time.ts            Dates and time zones
├── data/              The empty practice, and the demo, generated from a fixed seed
└── ui/                The web app: layout, components, pages and styles
```

`npm run typecheck` checks the types.
