import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const analyticsVisits = sqliteTable(
  'analytics_visits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull(),
    referrer: text('referrer').notNull(),
    visitorHash: text('visitor_hash').notNull(),
    device: text('device', { length: 1 }).notNull(), // 'D' | 'M' | 'B'
    language: text('language', { length: 2 }), // 'de', 'en'
    timestamp: integer('timestamp').notNull(),
  },
  (table) => ({
    timestampIdx: index('idx_analytics_timestamp').on(table.timestamp),
    pathIdx: index('idx_analytics_path').on(table.path),
  }),
);
