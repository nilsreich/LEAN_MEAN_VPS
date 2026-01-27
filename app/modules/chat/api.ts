import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { users } from '../../core/auth/schema';
import { db } from '../../core/db';
import { upgradeWebSocket, validateWsConnection } from '../../core/ws';
import { messages } from './schema';

const app = new Hono();

/**
 * WebSocket Endpoint für Realtime Chat
 * Pfad: /api/chat/ws
 */
app.get(
  '/ws',
  upgradeWebSocket(async (c) => {
    // 1. Zentrale Auth Validation
    const user = await validateWsConnection(c);

    // Wenn Auth fehlschlägt, geben wir einen Handler zurück, der sofort schließt.
    // Man könnte theoretisch auch undefined zurückgeben, aber Hono/Bun Upgrade erwartet Struktur.
    if (!user) {
      return {
        onOpen(_event, ws) {
          ws.close(1008, 'Unauthorized');
        },
      };
    }

    // Wenn Auth erfolgreich, geben wir den vollen Chat-Handler zurück
    return {
      onOpen(event, ws) {
        // 2. User Context speichern (in ws.data)
        // @ts-expect-error - Bun native property
        ws.data = { userId: user.userId, username: user.username };

        // 3. Raum-Abo
        const url = new URL(c.req.url);
        const room = url.searchParams.get('room') || 'general';

        // @ts-expect-error - Bun native method
        ws.subscribe(room);
        console.log(`WS: ${user.username} connected to ${room}`);
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

// WICHTIG: Kein Export von 'websocket' mehr, da zentral im Core verwaltet!
export default app;
