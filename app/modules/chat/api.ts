import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { db } from '../../core/db';
import { messages } from './schema';
import { users } from '../../core/auth/schema';
import { eq, and } from 'drizzle-orm';
import { parseCookies } from 'hono/cookie';
import { sessions } from '../../core/auth/schema';

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
        const cookieHeader = c.req.header('Cookie') || '';
        const cookies = parseCookies({ header: () => cookieHeader }); // Hono Helper nutzen
        const sessionId = cookies['auth_session'];

        if (!sessionId) {
          ws.close(1008, 'Unauthorized: No Session');
          return;
        }

        // 2. DB Validation (Ist die Session gültig?)
        // Wir holen auch gleich den Username für den Broadcast
        const session = await db.select({
            userId: sessions.userId,
            username: users.username,
            expiresAt: sessions.expiresAt
          })
          .from(sessions)
          .innerJoin(users, eq(sessions.userId, users.id))
          .where(eq(sessions.id, sessionId))
          .get(); // .get() ist effizienter als limit(1) bei SQLite

        if (!session || new Date(session.expiresAt) < new Date()) {
           ws.close(1008, 'Unauthorized: Invalid Session');
           return;
        }

        // 3. User Context speichern (in ws.data)
        // Das ermöglicht uns Zugriff auf Userdaten im onMessage Handler
        ws.data = { userId: session.userId, username: session.username };

        // 4. Raum-Abo
        const url = new URL(c.req.url);
        const room = url.searchParams.get('room') || 'general';

        ws.subscribe(room);
        console.log(`WS: ${session.username} connected to ${room}`);
      },
      async onMessage(event, ws) {
        const rawMsg = event.data;
        if (typeof rawMsg !== 'string') return;

        try {
          const payload = JSON.parse(rawMsg);
          const room = payload.room || 'general';
          const content = payload.content;

          if (!content || !ws.data) return;

          const { userId, username } = ws.data;

          // Broadcast via Bun Native Pub/Sub
          // Wir nutzen den authentifizierten Username aus ws.data
          const msgPayload = {
            type: 'message',
            content: content,
            room: room,
            username: username, // Sicherer Username
            createdAt: new Date().toISOString()
          };

          ws.publish(room, JSON.stringify(msgPayload));

          // Asynchrones Persistieren (Feuer & Vergessen für Performance)
          // Fehler hier sollten den Chat-Flow nicht blockieren
          db.insert(messages).values({
            userId: userId,
            content: content
          }).run(); // .run() ist void (schneller als returning)

        } catch (e) {
          console.error('WS Error:', e);
        }
      },
      onClose(_event, ws) {
        // Cleanup passiert automatisch bei Bun Pub/Sub
      },
    };
  })
);

/**
 * REST API für History (bleibt erhalten)
 */
app.get('/history', async (c) => {
  const room = c.req.query('room') || 'general';

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
  .limit(50);

  return c.json({ success: true, data: history });
});

export { websocket };
export default app;
