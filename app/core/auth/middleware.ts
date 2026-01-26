/**
 * ============================================================================
 * LEAN MEAN VPS - Authentication & Security Middleware
 * ============================================================================
 *
 * WAS:
 * Orchestrierung der Session-basierten Authentifizierung und des CSRF-Schutzes.
 *
 * WIE:
 * 1. Session-Management: Nutzt DB-gestützte Sessions (SQLite).
 * 2. Performance-Optimierung: Die Session wird in der 'authMiddleware' geladen
 *    und im Context (c.set('session')) gecached, um redundante DB-Lookups in
 *    der 'csrfMiddleware' zu vermeiden.
 * 3. Auto-Cleanup: Expired Sessions werden bei Erkennung sofort aus der DB gelöscht.
 * 4. CSRF-Protection: Validiert 'X-CSRF-Token' gegen den Session-Record.
 * 5. Security: Verwendet kryptografisch sichere Zufallswerte (CSPRNG).
 *
 * WARUM:
 * Minimiert DB-I/O durch Caching im Context und hält die Datenbank sauber,
 * indem verwaiste Sessions proaktiv entfernt werden.
 *
 * @version 1.2.0
 * ============================================================================
 */

import { eq, sql } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { db } from '../db';
import { sessions } from './schema';

/**
 * Inferierter Typ für eine Session aus dem Schema.
 */
type SessionRecord = typeof sessions.$inferSelect;

/**
 * Globales Environment-Interface für Hono.
 */
export type Env = {
  Variables: {
    userId: number;
    user: { id: number; username: string };
    session: SessionRecord;
  };
};

const SESSION_COOKIE = 'auth_session';
const CSRF_COOKIE = 'csrf_token';

/**
 * Generiert einen sicheren zufälligen String (Hex).
 * @param bytes Länge in Bytes (standard 32 für 256-bit Entropie)
 */
function generateSecureToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('hex');
}

/**
 * Erstellt eine neue Session und setzt die entsprechenden Cookies.
 */
export async function createSession(c: Context, userId: number) {
  const sessionId = crypto.randomUUID();
  const csrfToken = generateSecureToken(); // Explizites CSPRNG Hex-Token

  // Probabilistisches Cleanup (1% Chance)
  // Löscht abgelaufene Sessions, um die DB klein zu halten
  if (Math.random() < 0.01) {
    const now = new Date().toISOString();
    await db.delete(sessions).where(sql`${sessions.expiresAt} < ${now}`);
  }

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    csrfToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  });

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  setCookie(c, CSRF_COOKIE, csrfToken, {
    httpOnly: false, // Für Client-JS lesbar
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return { sessionId, csrfToken };
}

/**
 * Middleware: Authentifiziert den Request via Cookie.
 * Cacht die Session im Context, um Folge-Lookups zu sparen.
 */
export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const sessionId = getCookie(c, SESSION_COOKIE);

  if (!sessionId) {
    return c.redirect('/?error=unauthorized');
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

  // Validierung & Cleanup
  if (!session) {
    deleteCookie(c, SESSION_COOKIE);
    return c.redirect('/?error=unauthorized');
  }

  if (new Date(session.expiresAt) < new Date()) {
    // Proaktives Löschen abgelaufener Sessions aus der DB
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    deleteCookie(c, SESSION_COOKIE);
    return c.redirect('/?error=session_expired');
  }

  // Context-Injection für Folge-Middleware & Routen
  c.set('userId', session.userId);
  c.set('user', { id: session.userId, username: '' }); // Username wird bei Bedarf nachgeladen oder weggelassen
  c.set('session', session);

  await next();
};

/**
 * Middleware: CSRF-Validierung.
 * Nutzt die bereits geladene Session aus dem Context (Performance).
 */
export const csrfMiddleware = async (c: Context<Env>, next: Next) => {
  const session = c.get('session');
  const clientCsrf = c.req.header('X-CSRF-Token') || c.req.header('x-csrf-token');

  if (!session || !clientCsrf) {
    return c.json({ success: false, error: 'CSRF Token missing' }, 403);
  }

  if (session.csrfToken !== clientCsrf) {
    return c.json({ success: false, error: 'Invalid CSRF Token' }, 403);
  }

  await next();
};

/**
 * Beendet die Session.
 */
export async function clearAuth(c: Context) {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  deleteCookie(c, SESSION_COOKIE);
  deleteCookie(c, CSRF_COOKIE);
}
