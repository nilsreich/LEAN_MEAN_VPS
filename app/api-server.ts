/**
 * ============================================================================
 * LEAN MEAN VPS - Standalone Production API Server
 * ============================================================================
 *
 * WAS:
 * Der primäre Runtime-Prozess für die Auslieferung der Applikation unter Bun.
 *
 * WIE:
 * 1. API Mounting: Bindet spezialisierte API-Router ein.
 * 2. Static Delivery: Nutzt 'hono/bun' serveStatic für SSG-HTML und Assets.
 * 3. Path Isolation: Verhindert, dass API-Anfragen im statischen Fallback landen.
 *
 * WARUM:
 * Bun's native HTTP-Engine kombiniert mit Hono bietet maximale Performance
 * bei minimalem Overhead (Zero-Bloat Prinzip).
 *
 * @version 2.2.0
 * ============================================================================
 */

import { existsSync, mkdirSync } from 'node:fs';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { sql } from 'drizzle-orm';
import { db } from './core/db';
import { sessions } from './core/auth/schema';

import auth from './core/auth/api';
import chat, { websocket } from './modules/chat/api';
import storage from './modules/storage/api';
import tasks from './modules/tasks/api';

// Sicherstellen, dass das Upload-Verzeichnis existiert
if (!existsSync('data/uploads')) {
  mkdirSync('data/uploads', { recursive: true });
}

// Initialer Session Cleanup beim Server-Start
// Verhindert, dass alte Sessions ewig liegen bleiben, wenn wenig Traffic herrscht.
try {
  const now = new Date().toISOString();
  db.delete(sessions).where(sql`${sessions.expiresAt} < ${now}`).run();
  console.log('[System] Initial session cleanup completed.');
} catch (e) {
  // Ignorieren falls DB noch nicht existiert (erster Run)
}

const app = new Hono();

/**
 * API Routing
 * Evaluierung erfolgt VOR dem statischen Fallback.
 */
app.route('/api/auth', auth);
app.route('/api/tasks', tasks);
app.route('/api/chat', chat);
app.route('/api/storage', storage);

/**
 * Statische Assets & Service Worker
 */
app.use('/static/*', serveStatic({ root: './dist' }));
app.get('/manifest.webmanifest', serveStatic({ path: './dist/manifest.webmanifest' }));
app.get('/sw.js', serveStatic({ path: './dist/sw.js' }));

/**
 * SPA/SSG Fallback & Clean URLs
 */
const staticHandler = serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => {
    if (path.includes('.')) return path;
    if (path === '/') return '/index.html';
    return `${path}.html`;
  },
});

app.get('*', async (c, next) => {
  // Verhindert, dass fehlende API-Endpunkte als statische Seiten (z.B. /api/foo.html) gesucht werden.
  if (c.req.path.startsWith('/api/')) {
    return c.json({ success: false, error: 'API route not found' }, 404);
  }
  return staticHandler(c, next);
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
  websocket,
  hostname: '0.0.0.0',
};
