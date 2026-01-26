/**
 * ============================================================================
 * LEAN MEAN VPS - Realtime Chat API
 * ============================================================================
 *
 * TECHNISCHE IMPLEMENTIERUNG:
 * Wir nutzen Server-Sent Events (SSE) für den Downstream (Server -> Client)
 * und reguläre POST-Requests für den Upstream (Client -> Server).
 *
 * GRUND:
 * WebSockets erfordern dauerhafte TCP-Verbindungen und State-Management
 * (Ping/Pong), was auf 512MB RAM Servern bei vielen Usern kritisch sein kann.
 * SSE ist reines HTTP, stateless und extrem leichtgewichtig.
 *
 * SYNC STRATEGIE:
 * 1. Client verbindet sich mit /stream.
 * 2. Server hält Connection offen.
 * 3. Bei neuer Nachricht (POST) triggert ein Event-Bus (hier: simpler In-Memory
 *    EventEmitter) den Push an alle verbundenen Clients.
 * ============================================================================
 */

import { EventEmitter } from 'node:events';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { authMiddleware, type Env } from '../../core/auth/middleware';
import { db } from '../../core/db';
import { users } from '../../core/auth/schema';
import { messages } from './schema';

// Globaler Event-Bus für Inter-Process Communication (innerhalb der Bun-Instanz)
const chatBus = new EventEmitter();
chatBus.setMaxListeners(1000); // Erlaubt 1000 gleichzeitige SSE-Verbindungen

const api = new Hono<Env>();
api.use('*', authMiddleware);

const messageSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
});

/**
 * SSE Endpoint: Streamt Nachrichten in Echtzeit.
 * @route GET /api/chat/stream
 */
api.get('/stream', async (c) => {
  return streamSSE(c, async (stream) => {
    // Listener für neue Nachrichten
    const onMessage = (msg: any) => {
      stream.writeSSE({
        data: JSON.stringify(msg),
        event: 'message',
        id: String(Date.now()),
      });
    };

    chatBus.on('message', onMessage);

    // Keep-Alive (verhindert Timeout durch Load-Balancer/Reverse-Proxies)
    const keepAlive = setInterval(() => {
      stream.writeSSE({ event: 'ping', data: '' });
    }, 15000);

    // Cleanup bei Verbindungsabbruch
    stream.onAbort(() => {
      chatBus.off('message', onMessage);
      clearInterval(keepAlive);
    });

    // Warten bis Client trennt
    while (true) {
      await stream.sleep(1000);
    }
  });
});

/**
 * Sendet eine Nachricht.
 * @route POST /api/chat/send
 */
api.post('/send', zValidator('json', messageSchema), async (c) => {
  const user = c.get('user');
  const { content } = c.req.valid('json');

  // 1. Persistieren in SQLite
  const [newMsg] = await db.insert(messages).values({
    userId: user.id,
    content,
  }).returning();

  // Username fetchen (für UI Darstellung)
  const sender = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { username: true }
  });

  const payload = {
    ...newMsg,
    username: sender?.username || 'Unknown',
  };

  // 2. Broadcast via EventBus
  chatBus.emit('message', payload);

  return c.json({ success: true, data: payload });
});

/**
 * Lädt Historie (letzte 50 Nachrichten).
 * @route GET /api/chat/history
 */
api.get('/history', async (c) => {
  const history = await db.select({
    id: messages.id,
    content: messages.content,
    createdAt: messages.createdAt,
    userId: messages.userId,
    username: users.username
  })
  .from(messages)
  .leftJoin(users, eq(messages.userId, users.id))
  .orderBy(messages.createdAt)
  .limit(50); // Performance Limit

  return c.json({ success: true, data: history });
});

export default api;
