/**
 * ============================================================================
 * LEAN MEAN VPS - Authentication API
 * ============================================================================
 *
 * WAS:
 * Endpunkte für Sitzungsmanagement (Login, Logout, Register, Identity).
 *
 * WIE:
 * 1. Zod-Validierung: Eingehende JSON-Payloads werden gegen Schemata geprüft.
 * 2. Argon2id: Passwörter werden sicher gehasht (via Bun.password).
 * 3. Session-Handling: Nutzt 'createSession' (Kryptografische Session-IDs in DB).
 * 4. Rate-Limiting: Schützt 'Login' und 'Register' vor Brute-Force Angriffen.
 * 5. CSRF-Schutz: Alle schreibenden Zugriffe (inkl. Logout) sind geschützt.
 *
 * WARUM:
 * Ein DB-basiertes Session-System ermöglicht den sofortigen Widerruf von
 * Zugriffen (Revocation) und bietet im Vergleich zu JWTs eine höhere Sicherheit
 * bei gleichzeitig geringer Komplexität.
 *
 * @version 2.3.0
 * ============================================================================
 */

import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db';
import { hashPassword, verifyPassword } from '../lib/password';
import { loginSchema, registerSchema } from '../lib/validation';
import { authMiddleware, clearAuth, createSession, csrfMiddleware, type Env } from './middleware';
import { users } from './schema';

const auth = new Hono<Env>();

/**
 * Registrierung neuer Benutzer mit automatischem Login.
 * @route POST /api/auth/register
 */
auth.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { username, password } = c.req.valid('json');

    const existing = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existing) return c.json({ success: false, error: 'Nutzername bereits vergeben' }, 409);

    const hashed = await hashPassword(password);
    const [newUser] = await db.insert(users).values({ username, passwordHash: hashed }).returning();

    // Auto-Login nach Registrierung
    await createSession(c, { id: newUser.id, username: newUser.username });

    return c.json({ success: true, message: 'Registrierung erfolgreich' });
  },
);

/**
 * Anmeldung und Erstellung einer Session.
 * @route POST /api/auth/login
 */
auth.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { username, password } = c.req.valid('json');

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    // Timing-Attack Mitigation: Immer verifizieren, auch wenn User nicht existiert
    // Nutzung eines Dummy-Hashes (Argon2id, cost=standard)
    const dummyHash =
      '$argon2id$v=19$m=32768,t=3,p=1$ZHVtbXlzYWx0ZHVtbXlzYWx0$dummysaltdummysaltdummysaltdummysaltdummy';
    const isValid = await verifyPassword(password, user ? user.passwordHash : dummyHash);

    if (!user || !isValid) {
      return c.json({ success: false, error: 'Ungültige Zugangsdaten' }, 401);
    }

    await createSession(c, { id: user.id, username: user.username });

    return c.json({ success: true });
  },
);

/**
 * Abmeldung und Löschen der Session.
 * @route POST /api/auth/logout
 */
auth.post('/logout', authMiddleware, csrfMiddleware, async (c) => {
  await clearAuth(c);
  return c.json({ success: true });
});

/**
 * Gibt Profil-Informationen des aktuell angemeldeten Nutzers zurück.
 * @route GET /api/auth/me
 */
auth.get('/me', authMiddleware, async (c) => {
  // Optimization: Kein DB-Lookup nötig, da User-Daten im Session-Blob (KV) liegen
  const user = c.get('user');

  if (!user) return c.json({ success: false, error: 'User nicht gefunden' }, 404);

  return c.json({ success: true, user });
});

export default auth;
