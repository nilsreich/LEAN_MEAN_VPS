/**
 * ============================================================================
 * LEAN MEAN VPS - Database Schema Definition
 * ============================================================================
 *
 * WAS:
 * Definition der relationalen Tabellenstruktur für SQLite.
 *
 * WIE:
 * 1. Drizzle-ORM: Nutzung der 'drizzle-orm/sqlite-core' Funktionsbibliothek.
 * 2. Relationen: Implementierung von One-to-Many Beziehungen (User -> Todos,
 *    User -> sessions).
 * 3. Indizierung: Automatische Primärschlüssel-Generierung und Foreign-Key
 *    Constraints zur Sicherung der referentiellen Integrität.
 * 4. Datentypen: Gezielter Einsatz von 'integer' für IDs (Auto-Increment) und
 *    'text' für ISO-Timestamps.
 *
 * WARUM:
 * Ein typsicheres Schema verhindert Laufzeitfehler bei DB-Abfragen und bildet
 * das Rückgrat der Anwendungslogik. SQLite bietet hierbei die beste Balance
 * zwischen Feature-Set und Ressourcenverbrauch für VPS-Umgebungen.
 *
 * @version 1.1.1
 * ============================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Benutzer-Tabelle
 * Speichert Kern-Accountdaten und kryptografische Hashes.
 */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Todo-Tabelle
 * Aufgabenliste mit Status-Tracking und User-Zuordnung.
 */
export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Uploads-Tabelle
 * Metadaten-Verzeichnis für physisch auf dem VPS gespeicherte Dateien.
 */
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

/**
 * Sessions-Tabelle
 * Persistente Session-Daten für die hybride Cookie/DB-Authentifizierung.
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // UUID
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  csrfToken: text('csrf_token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
