// The mock Carepatron in one app: the JSON API, the web app, and the stylesheet.

import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { api, BadRequest } from './api';
import { createAuth } from './auth';
import type { Database } from './db';
import type { Dataset } from './model';
import { Conflict, createStore, Invalid, NotFound } from './store';
import { notFoundPage, web } from './ui/routes';

interface Options {
  /** Where the practice is stored. */
  db: Database;
  /** How a new practice starts, and what a reset goes back to. */
  start: () => Dataset;
}

export function createApp({ db, start }: Options) {
  const store = createStore(db, start);
  const auth = createAuth(store);
  const styles = readFileSync(new URL('./ui/styles.css', import.meta.url), 'utf8');

  const app = new Hono({ strict: false });
  app.get('/assets/styles.css', (c) => c.body(styles, 200, { 'Content-Type': 'text/css; charset=utf-8' }));
  app.route('/api/v1', api(store, auth));
  app.route('/', web(store, auth));

  const isApi = (path: string) => path === '/api' || path.startsWith('/api/');
  const error = (code: string, message: string, extra = {}) => ({ error: { code, message, ...extra } });
  app.notFound((c) => (isApi(c.req.path) ? c.json(error('not_found', `Nothing at ${c.req.path}.`), 404) : notFoundPage(c)));
  app.onError((err, c) => {
    // Responses middleware has already decided on, such as a refused cross-site form.
    if (err instanceof HTTPException) return err.getResponse();
    if (err instanceof Invalid) return c.json(error('invalid', err.message, { issues: err.issues }), 400);
    if (err instanceof BadRequest) return c.json(error('bad_request', err.message), 400);
    if (err instanceof NotFound) return c.json(error('not_found', err.message), 404);
    if (err instanceof Conflict) return c.json(error('conflict', err.message), 409);
    console.error(err);
    return isApi(c.req.path) ? c.json(error('server_error', 'Something went wrong.'), 500) : c.text('Something went wrong.', 500);
  });

  return app;
}
