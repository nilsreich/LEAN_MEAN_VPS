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
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import auth from './core/auth/api';
import { sessions } from './core/auth/schema';
import { db, getDb } from './core/db';
import { websocket } from './core/ws';
import analytics from './modules/analytics/api';
import { cleanupAnalytics } from './modules/analytics/cleanup';
import { analyticsMiddleware } from './modules/analytics/middleware';
import chat from './modules/chat/api';
import storage from './modules/storage/api';
import tasks from './modules/tasks/api';

// Sicherstellen, dass das Upload-Verzeichnis existiert
if (!existsSync('data/uploads')) {
  mkdirSync('data/uploads', { recursive: true });
}

// DB Init (Table Creation / Migration Check)
await getDb();

// Initialer Session Cleanup beim Server-Start
// Verhindert, dass alte Sessions ewig liegen bleiben, wenn wenig Traffic herrscht.
// Hinweis: Wir nutzen IIFE/Promise-Handling, da Top-Level-Await in manchen Contexts heikel sein kann,
// aber in Bun eigentlich supported ist. Hier sicherheitshalber mit .catch().
const now = new Date().toISOString();
db.delete(sessions)
  .where(sql`json_extract(${sessions.value}, '$.expiresAt') < ${now}`)
  .then(() => console.log('[System] Initial session cleanup completed.'))
  .catch(() => {
    // Ignorieren falls DB noch nicht existiert (erster Run) oder KV-Migration läuft
  });

// Analytics Cleanup Task (täglich)
setInterval(
  () => {
    cleanupAnalytics();
  },
  1000 * 60 * 60 * 24,
);

const app = new Hono();

/**
 * Global Middlewares
 */
app.use('*', analyticsMiddleware);

/**
 * API Routing
 * Evaluierung erfolgt VOR dem statischen Fallback.
 */
app.route('/api/auth', auth);
app.route('/api/tasks', tasks);
app.route('/api/chat', chat);
app.route('/api/storage', storage);
app.route('/api/analytics', analytics);

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
