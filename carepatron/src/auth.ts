// Signing in. The mock has one login, the practice owner's. The web app keeps
// you signed in with a cookie; the API takes a bearer token, and only that.

import { randomBytes } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { TeamMember } from './model';
import type { Store } from './store';

export const LOGIN = { email: 'you@practice.example', password: 'carepatron' } as const;

/** One cookie per port, so a practice and the demo can be open side by side. */
const cookieName = (c: Context) => `carepatron_session_${new URL(c.req.url).port || 'default'}`;
const SESSION_HOURS = 8;

export type AppEnv = { Variables: { user: TeamMember } };
export type Auth = ReturnType<typeof createAuth>;

export function createAuth(store: Store) {
  /** Session tokens, and when each expires. */
  const sessions = new Map<string, number>();

  const bearer = (c: Context) => c.req.header('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const cookie = (c: Context) => getCookie(c, cookieName(c));

  function valid(token: string | undefined): boolean {
    const expiresAt = token ? sessions.get(token) : undefined;
    if (!token || expiresAt === undefined) return false;
    if (expiresAt < Date.now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  }

  /** Checks the email and password, and opens a session if they match. */
  function signIn(email: string, password: string) {
    if (email.trim().toLowerCase() !== LOGIN.email || password !== LOGIN.password) return null;
    const token = randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + SESSION_HOURS * 3_600_000;
    sessions.set(token, expiresAt);
    return { token, expiresAt: new Date(expiresAt).toISOString(), user: store.owner };
  }

  /** For pages: sends anyone signed out to the sign-in page, and back afterwards. */
  const page: MiddlewareHandler<AppEnv> = async (c, next) => {
    if (!valid(cookie(c))) {
      const { pathname, search } = new URL(c.req.url);
      return c.redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
    }
    c.set('user', store.owner);
    await next();
  };

  /** For the API: a 401 without a valid token. */
  const api: MiddlewareHandler<AppEnv> = async (c, next) => {
    if (!valid(bearer(c))) {
      const message = 'Sign in first: POST /api/v1/auth/login, then send "Authorization: Bearer <token>".';
      return c.json({ error: { code: 'unauthorized', message } }, 401);
    }
    c.set('user', store.owner);
    await next();
  };

  return {
    signIn,
    page,
    api,
    /** Keeps a browser signed in. */
    rememberBrowser(c: Context, token: string) {
      setCookie(c, cookieName(c), token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: SESSION_HOURS * 3600 });
    },
    signOut(c: Context) {
      const token = cookie(c);
      if (token) sessions.delete(token);
      deleteCookie(c, cookieName(c), { path: '/' });
    },
  };
}
