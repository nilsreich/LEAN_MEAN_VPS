import type { ServerWebSocket } from 'bun';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { getCookie } from 'hono/cookie';
import { sessions } from './auth/schema';
import { db } from './db';

// Definition der Daten, die wir an den WebSocket hängen
export interface WsUserData {
  userId: number;
  username: string;
}

// Zentrale Instanz erstellen
// Dies stellt sicher, dass wir nur EINEN WebSocket-Handler für den gesamten Server haben,
// egal wie viele Module WebSockets nutzen.
export const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<WsUserData>>();

/**
 * Zentraler Validator für WebSocket-Upgrades.
 * Extrahiert User-Kontext aus dem Session-Cookie.
 *
 * @param c Hono Context
 * @returns UserData oder null wenn ungültig
 */
export async function validateWsConnection(c: Context): Promise<WsUserData | null> {
  const sessionId = getCookie(c, 'auth_session');
  if (!sessionId) return null;

  // KV Lookup: Direkter Zugriff auf den Session-Blob
  // Wir nutzen hier bewusst keinen JOIN, sondern das denormalisierte JSON
  const [record] = await db.select().from(sessions).where(eq(sessions.key, sessionId)).limit(1);

  if (!record) return null;

  const sessionData = record.value;

  // Validierung der Expiry
  if (new Date(sessionData.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.key, sessionId));
    return null;
  }

  return {
    userId: sessionData.user.id,
    username: sessionData.user.username,
  };
}
