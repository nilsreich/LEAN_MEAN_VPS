import type { ServerWebSocket } from 'bun';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { getCookie } from 'hono/cookie';
import { sessions, users } from '../../core/auth/schema';
import { db } from '../../core/db';
import { messages } from './schema';

// Wir definieren den Context für den WebSocket (User-Daten)
interface WsUserData {
  userId: number;
  username: string;
}

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<WsUserData>>();

const app = new Hono();

/**
 * WebSocket Endpoint für Realtime Chat
 * Pfad: /api/chat/ws
 */
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      async onOpen(event, ws) {
        // 1. Auth Check
        // getCookie holt bei Hono automatisch aus dem Context (c)
        const sessionId = getCookie(c, 'auth_session');

        if (!sessionId) {
          ws.close(1008, 'Unauthorized: No Session');
          return;
        }

        // 2. DB Validation (Ist die Session gültig?)
        // KV Lookup: Direkter Zugriff auf den Session-Blob
        const [record] = await db
          .select()
          .from(sessions)
          .where(eq(sessions.key, sessionId))
          .limit(1);

        if (!record) {
          ws.close(1008, 'Unauthorized: Invalid Session');
          return;
        }

        const sessionData = record.value;

        if (new Date(sessionData.expiresAt) < new Date()) {
          ws.close(1008, 'Unauthorized: Session Expired');
          return;
        }

        // 3. User Context speichern (in ws.data)
        // Das ermöglicht uns Zugriff auf Userdaten im onMessage Handler
        // @ts-expect-error - Bun native property
        ws.data = { userId: sessionData.user.id, username: sessionData.user.username };

        // 4. Raum-Abo
        const url = new URL(c.req.url);
        const room = url.searchParams.get('room') || 'general';

        // @ts-expect-error - Bun native method
        ws.subscribe(room);
        console.log(`WS: ${sessionData.user.username} connected to ${room}`);
      },
      async onMessage(event, ws) {
        const rawMsg = event.data;
        if (typeof rawMsg !== 'string') return;

        try {
          const payload = JSON.parse(rawMsg);
          const room = payload.room || 'general';
          const content = payload.content;

          // @ts-expect-error - Bun native property
          if (!content || !ws.data) return;

          // @ts-expect-error - Bun native property
          const { userId, username } = ws.data;

          // Broadcast via Bun Native Pub/Sub
          // Wir nutzen den authentifizierten Username aus ws.data
          const msgPayload = {
            type: 'message',
            content: content,
            room: room,
            username: username, // Sicherer Username
            createdAt: new Date().toISOString(),
          };

          // @ts-expect-error - Bun native method
          ws.publish(room, JSON.stringify(msgPayload));

          // Echo an Sender (da publish nur an ANDERE subscribers geht)
          ws.send(JSON.stringify(msgPayload));

          // Asynchrones Persistieren (Feuer & Vergessen für Performance)
          // Fehler hier sollten den Chat-Flow nicht blockieren
          db.insert(messages)
            .values({
              userId: userId,
              content: content,
            })
            .catch((e) => console.error('Chat Persist Error:', e));
        } catch (e) {
          console.error('WS Error:', e);
        }
      },
      onClose(_event, ws) {
        // Cleanup passiert automatisch bei Bun Pub/Sub
      },
    };
  }),
);

/**
 * REST API für History (bleibt erhalten)
 */
app.get('/history', async (c) => {
  const room = c.req.query('room') || 'general';

  const history = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      userId: messages.userId,
      username: users.username,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .orderBy(messages.createdAt)
    .limit(50);

  return c.json({ success: true, data: history });
});

export { websocket };
export default app;
