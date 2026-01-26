import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '../../core/auth/schema';

export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(), // UUID
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  filename: text('filename').notNull(),
  size: integer('size').notNull(), // in Bytes
  mimeType: text('mime_type').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
