// The building blocks every page is made of.

import type { Child } from 'hono/jsx';
import { hash } from '../data/random';
import { icons } from './icons';

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet';

export const Badge = ({ tone = 'gray', children }: { tone?: Tone; children: Child }) => <span class={`badge ${tone}`}>{children}</span>;

/** A status as a badge, from a map of labels and tones. Unknown values show as they are. */
export function Status({ map, value }: { map: Record<string, [label: string, tone: Tone]>; value: string }) {
  const [label, tone] = map[value] ?? [value, 'gray'];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Avatar({ name, seed, size = 'md' }: { name: string; seed: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span class={`avatar ${size} hue-${hash(seed) % 6}`}>{initials}</span>;
}

export const PageHeader = ({
  title,
  subtitle,
  back,
  actions,
}: {
  title: Child;
  subtitle?: Child;
  back?: { href: string; label: string };
  actions?: Child;
}) => (
  <header class="page-header">
    <div>
      {back && (
        <a class="back" href={back.href}>
          {icons.back}
          {back.label}
        </a>
      )}
      <h1>{title}</h1>
      {subtitle && <p class="subtitle">{subtitle}</p>}
    </div>
    {actions && <div class="actions">{actions}</div>}
  </header>
);

export const Card = ({ title, action, flush, children }: { title?: Child; action?: Child; flush?: boolean; children: Child }) => (
  <section class={flush ? 'card flush' : 'card'}>
    {title && (
      <header class="card-header">
        <h2>{title}</h2>
        {action}
      </header>
    )}
    <div class="card-body">{children}</div>
  </section>
);

export const Fields = ({ children }: { children: Child }) => <dl class="fields">{children}</dl>;

export const Field = ({ label, children }: { label: string; children?: Child }) => (
  <div class="field">
    <dt>{label}</dt>
    <dd>
      {children === null || children === undefined || children === false || children === '' ? <span class="muted">Not set</span> : children}
    </dd>
  </div>
);

export const Empty = ({ children }: { children: Child }) => <div class="empty">{children}</div>;

/** Links that filter or switch a view. */
export const Segmented = ({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) => (
  <nav class="segmented">
    {items.map((item) => (
      <a href={item.href} class={item.active ? 'active' : undefined} aria-current={item.active ? 'page' : undefined}>
        {item.label}
        {item.count !== undefined && <span class="count">{item.count}</span>}
      </a>
    ))}
  </nav>
);

export const Tabs = ({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) => (
  <nav class="tabs">
    {items.map((item) => (
      <a href={item.href} class={item.active ? 'tab active' : 'tab'} aria-current={item.active ? 'page' : undefined}>
        {item.label}
        {item.count !== undefined && <span class="count">{item.count}</span>}
      </a>
    ))}
  </nav>
);

export function Pagination({
  page,
  perPage,
  total,
  href,
}: {
  page: number;
  perPage: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages === 1) return null;
  const first = (page - 1) * perPage + 1;
  return (
    <nav class="pagination" aria-label="Pages">
      <span>
        {first}–{Math.min(total, page * perPage)} of {total}
      </span>
      <div>
        <a class={page > 1 ? 'button' : 'button disabled'} href={href(page - 1)} rel="prev">
          {icons.left} Previous
        </a>
        <a class={page < pages ? 'button' : 'button disabled'} href={href(page + 1)} rel="next">
          Next {icons.right}
        </a>
      </div>
    </nav>
  );
}

/** A URL with some query parameters changed. Empty values are dropped. */
export function withQuery(url: URL, changes: Record<string, string | number | null>): string {
  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}
