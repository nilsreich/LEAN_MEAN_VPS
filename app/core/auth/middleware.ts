/**
 * ============================================================================
 * LEAN MEAN VPS - Authentication & Security Middleware
 * ============================================================================
 *
 * WAS:
 * Orchestrierung der Session-basierten Authentifizierung und des CSRF-Schutzes.
 *
 * WIE:
 * 1. Session-Management: Nutzt DB-gestützte Sessions (LibSQL/KV).
 * 2. Performance-Optimierung: Die Session wird als JSON-Blob (Key-Value) geladen.
 *    Kein Join mehr nötig - User-Daten sind denormalisiert im Session-Blob.
 * 3. Auto-Cleanup: Expired Sessions werden bei Erkennung sofort aus der DB gelöscht.
 * 4. CSRF-Protection: Validiert 'X-CSRF-Token' gegen den Session-Record.
 * 5. Security: Verwendet kryptografisch sichere Zufallswerte (CSPRNG).
 *
 * WARUM:
 * Minimiert DB-I/O durch direkten Key-Lookup und vermeidet Joins.
 *
 * @version 1.3.0
 * ============================================================================
 */

import { eq, sql } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { db } from '../db';
import { type SessionData, sessions } from './schema';

/**
 * Globales Environment-Interface für Hono.
 */
export type Env = {
  Variables: {
    userId: number;
    user: { id: number; username: string };
    session: SessionData;
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
 * Speichert User-Daten denormalisiert im Session-Blob.
 */
export async function createSession(c: Context, user: { id: number; username: string }) {
  const sessionId = crypto.randomUUID();
  const csrfToken = generateSecureToken(); // Explizites CSPRNG Hex-Token

  // Probabilistisches Cleanup (1% Chance)
  // Löscht abgelaufene Sessions, um die DB klein zu halten
  // Nutzt json_extract für den Zugriff auf den JSON-Blob
  if (Math.random() < 0.01) {
    const now = new Date().toISOString();
    await db.delete(sessions).where(sql`json_extract(${sessions.value}, '$.expiresAt') < ${now}`);
  }

  const sessionData: SessionData = {
    userId: user.id,
    csrfToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date().toISOString(),
    user: user,
  };

  await db.insert(sessions).values({
    key: sessionId,
    value: sessionData,
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
 * Lädt die denormalisierte Session (KV-Lookup).
 */
export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const sessionId = getCookie(c, SESSION_COOKIE);

  if (!sessionId) {
    return c.redirect('/?error=unauthorized');
  }

  // Optimized Key-Lookup (Primary Key Access)
  const [record] = await db.select().from(sessions).where(eq(sessions.key, sessionId)).limit(1);

  // Validierung & Cleanup
  if (!record) {
    deleteCookie(c, SESSION_COOKIE);
    return c.redirect('/?error=unauthorized');
  }

  const sessionData = record.value;

  if (new Date(sessionData.expiresAt) < new Date()) {
    // Proaktives Löschen abgelaufener Sessions aus der DB
    await db.delete(sessions).where(eq(sessions.key, sessionId));
    deleteCookie(c, SESSION_COOKIE);
    return c.redirect('/?error=session_expired');
  }

  // Context-Injection (Daten kommen direkt aus dem Blob, kein User-Join nötig)
  c.set('userId', sessionData.userId);
  c.set('user', sessionData.user);
  c.set('session', sessionData);

  await next();
};

/**
 * Middleware: CSRF-Validierung.
 * Nutzt die bereits geladene Session aus dem Context.
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
    await db.delete(sessions).where(eq(sessions.key, sessionId));
  }
  deleteCookie(c, SESSION_COOKIE);
  deleteCookie(c, CSRF_COOKIE);
}
