// The web app's pages.

import { Hono, type Context } from 'hono';
import { csrf } from 'hono/csrf';
import { html } from 'hono/html';
import type { Child } from 'hono/jsx';
import type { AppEnv, Auth } from '../auth';
import { isDate, localDate, startOfWeek } from '../time';
import type { ClientStatus, Note, NoteType } from '../model';
import type { Store } from '../store';
import { createFormat } from './format';
import { Document, type View } from './layout';
import { AppointmentsPage } from './pages/appointments';
import { CLIENT_TABS, ClientPage, type ClientTab } from './pages/client';
import { ClientsPage } from './pages/clients';
import { LoginPage } from './pages/login';
import { NotePage, NotesPage } from './pages/notes';
import { OverviewPage } from './pages/overview';
import { SETTINGS, SettingsPage, type SettingsSection } from './pages/settings';

const render = (c: Context, page: Child, status: 200 | 401 | 404 = 200) => c.html(html`<!doctype html>${page}`, status);

export function web(store: Store, auth: Auth) {
  const app = new Hono<AppEnv>({ strict: false });

  // Forms only count when they come from these pages, not from another site or port.
  app.use(csrf());

  // The practice's time zone and currency can change at any time, so each page reads them afresh.
  const view = (c: Context<AppEnv>): View => {
    const now = new Date();
    const timeZone = store.practice.timezone;
    const format = createFormat(timeZone, store.practice.currency);
    return { store, user: c.get('user'), format, url: new URL(c.req.url), now, today: localDate(now, timeZone) };
  };

  /** A query parameter, if it's one of the allowed values. */
  const pick = <T extends string>(c: Context, name: string, allowed: readonly T[]) => {
    const value = c.req.query(name);
    return allowed.includes(value as T) ? (value as T) : undefined;
  };
  const pageNumber = (c: Context) => Math.max(1, Number.parseInt(c.req.query('page') ?? '', 10) || 1);

  app.get('/login', (c) => render(c, <LoginPage next={safeNext(c.req.query('next'))} />));

  app.post('/login', async (c) => {
    const form = await c.req.parseBody();
    const email = String(form.email ?? '');
    const next = safeNext(String(form.next ?? ''));
    const session = auth.signIn(email, String(form.password ?? ''));
    if (!session) return render(c, <LoginPage next={next} email={email} error="That email and password don't match." />, 401);
    auth.rememberBrowser(c, session.token);
    return c.redirect(next);
  });

  app.post('/logout', (c) => {
    auth.signOut(c);
    return c.redirect('/login');
  });

  app.get('/', auth.page, (c) => render(c, <OverviewPage view={view(c)} />));

  app.get('/clients', auth.page, (c) => {
    const status = pick<ClientStatus>(c, 'status', ['active', 'inactive', 'discharged']);
    return render(c, <ClientsPage view={view(c)} search={c.req.query('search')?.trim() ?? ''} status={status} page={pageNumber(c)} />);
  });

  app.get('/clients/:id/:tab?', auth.page, (c) => {
    const client = store.client(c.req.param('id'));
    const tab = (c.req.param('tab') ?? 'overview') as ClientTab;
    if (!client || !CLIENT_TABS.includes(tab)) return c.notFound();
    return render(c, <ClientPage view={view(c)} client={client} tab={tab} />);
  });

  app.get('/appointments', auth.page, (c) => {
    const v = view(c);
    const asked = c.req.query('week');
    const week = startOfWeek(asked && isDate(asked) ? asked : v.today);
    const clinicianId = store.teamMember(c.req.query('clinician') ?? '')?.id;
    return render(c, <AppointmentsPage view={v} week={week} clinicianId={clinicianId} />);
  });

  app.get('/notes', auth.page, (c) => {
    const status = pick<Note['status']>(c, 'status', ['draft', 'signed']);
    const type = pick<NoteType>(c, 'type', ['intake', 'progress', 'treatment_plan', 'contact', 'discharge']);
    return render(c, <NotesPage view={view(c)} status={status} type={type} page={pageNumber(c)} />);
  });

  app.get('/notes/:id', auth.page, (c) => {
    const note = store.note(c.req.param('id'));
    return note ? render(c, <NotePage view={view(c)} note={note} />) : c.notFound();
  });

  app.post('/settings/reset', auth.page, async (c) => {
    const form = await c.req.parseBody();
    if (form.confirm !== 'on') return c.redirect('/settings');
    store.reset();
    return c.redirect('/');
  });

  app.get('/settings/:section?', auth.page, (c) => {
    const section = (c.req.param('section') ?? 'practice') as SettingsSection;
    return Object.hasOwn(SETTINGS, section) ? render(c, <SettingsPage view={view(c)} section={section} />) : c.notFound();
  });

  return app;
}

export const notFoundPage = (c: Context) =>
  render(
    c,
    <Document title="Not found">
      <div class="auth">
        <div class="auth-card center">
          <h1>Page not found</h1>
          <p class="muted">There's nothing at this address.</p>
          <a class="button primary" href="/">
            Back to Carepatron
          </a>
        </div>
      </div>
    </Document>,
    404,
  );

/** Only ever send people back to a page on this site after signing in. */
function safeNext(next: string | undefined): string {
  const here = 'http://carepatron.invalid';
  try {
    const url = new URL(next || '/', here);
    // `new URL` resolves tricks like "/%09/evil.example"; anything off-site goes home.
    return url.origin === here ? `/${url.pathname.replace(/^\/+/, '')}${url.search}` : '/';
  } catch {
    return '/';
  }
}
