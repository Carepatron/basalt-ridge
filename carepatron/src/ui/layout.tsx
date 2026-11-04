// The HTML document and the signed-in app shell around every page.

import type { Child } from 'hono/jsx';
import type { DateString, TeamMember } from '../model';
import type { Store } from '../store';
import { Avatar } from './components';
import { ROLE, type Format } from './format';
import { FAVICON, icons, logo } from './icons';

/** What every page gets to render with. */
export interface View {
  store: Store;
  user: TeamMember;
  format: Format;
  url: URL;
  now: Date;
  today: DateString;
}

export type Section = 'overview' | 'clients' | 'appointments' | 'notes' | 'settings';

const NAV: { section: Section; label: string; href: string; icon: Child }[] = [
  { section: 'overview', label: 'Overview', href: '/', icon: icons.home },
  { section: 'clients', label: 'Clients', href: '/clients', icon: icons.users },
  { section: 'appointments', label: 'Appointments', href: '/appointments', icon: icons.calendar },
  { section: 'notes', label: 'Notes', href: '/notes', icon: icons.note },
  { section: 'settings', label: 'Settings', href: '/settings', icon: icons.settings },
];

export const Document = ({ title, children }: { title: string; children: Child }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{`${title} · Carepatron (mock)`}</title>
      <link rel="icon" href={FAVICON} />
      <link rel="stylesheet" href="/assets/styles.css" />
    </head>
    <body>{children}</body>
  </html>
);

export function Shell({ view, section, title, children }: { view: View; section: Section; title: string; children: Child }) {
  const { user, store } = view;
  const name = `${user.firstName} ${user.lastName}`;
  const address = store.practice.address;
  return (
    <Document title={title}>
      <div class="app">
        <aside class="sidebar">
          <a class="brand" href="/">
            {logo()}
            <span>Carepatron</span>
            <span class="mock">Mock</span>
          </a>
          <div class="practice">
            <strong>{store.practice.name}</strong>
            <span>{address ? `${address.city}, ${address.state}` : 'No address yet'}</span>
          </div>
          <nav class="nav" aria-label="Main">
            {NAV.map((item) => (
              <a
                href={item.href}
                class={item.section === section ? 'active' : undefined}
                aria-current={item.section === section ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div class="me">
            <Avatar name={name} seed={user.id} />
            <div class="me-text">
              <strong>{name}</strong>
              <span>{ROLE[user.role]}</span>
            </div>
            <form method="post" action="/logout">
              <button class="icon-button" type="submit" title="Sign out" aria-label="Sign out">
                {icons.signOut}
              </button>
            </form>
          </div>
        </aside>
        <main class="main">{children}</main>
      </div>
    </Document>
  );
}
