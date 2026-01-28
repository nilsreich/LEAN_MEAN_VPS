import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Denormalisierte Session-Daten für den KV-Store.
 */
export interface SessionData {
  userId: number;
  csrfToken: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
}

export const sessions = sqliteTable('sessions', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<SessionData>().notNull(),
  expiresAt: text('expires_at').notNull(),
});
