// Starts the mock. `npm start` opens your practice on port 4000, stored in
// SQLite at .data/carepatron.db: empty until something moves in, and still
// there next time. `npm run demo` opens a practice that's already set up on
// port 4001, held in memory, so any changes are forgotten when it stops.

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { LOGIN } from './auth';
import { demoPractice } from './data';
import { emptyPractice } from './data/empty';
import { openDatabase } from './db';

const demo = process.argv.includes('--demo');
const port = Number(process.env.PORT ?? (demo ? 4001 : 4000));
const folder = fileURLToPath(new URL('../.data/', import.meta.url));

if (!demo) mkdirSync(folder, { recursive: true });
const db = openDatabase(demo ? ':memory:' : `${folder}carepatron.db`);
const app = createApp({ db, start: demo ? () => demoPractice() : emptyPractice });

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`
  Carepatron (mock) is running at http://localhost:${port}

  Sign in    ${LOGIN.email} / ${LOGIN.password}
  API        http://localhost:${port}/api/v1
  ${demo ? 'Demo       A practice that is already set up. Changes are forgotten when it stops.' : 'Database   carepatron/.data/carepatron.db (SQLite). Settings › Start over empties it.'}
`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code !== 'EADDRINUSE') throw error;
  console.error(
    `\n  Port ${port} is already in use. Stop whatever is using it, or pick another: PORT=${port + 10} npm ${demo ? 'run demo' : 'start'}\n`,
  );
  process.exit(1);
});

// Close the database cleanly when stopped.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
