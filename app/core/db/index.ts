/**
 * ============================================================================
 * LEAN MEAN VPS - Database Bootstrapper
 * ============================================================================
 *
 * WAS:
 * Initialisierung und Export der zentralen Datenbankinstanz (Drizzle + SQLite).
 *
 * WIE:
 * 1. Runtime-Detection: Erkennt dynamisch, ob die Anwendung in der Bun-Runtime
 *    oder während des statischen Builds (Node.js) ausgeführt wird.
 * 2. Mocking/Proxying: Implementiert ein Proxy-basiertes Mocking-System für
 *    den Build-Prozess. Dies verhindert Abstürze beim Zugriff auf native
 *    Bun-APIs ('bun:sqlite') während des Vite-Bundlings.
 * 3. WAL-Mode: Aktiviert 'Write-Ahead Logging' für SQLite, um parallele
 *    Read/Write-Zugriffe ohne Sperrkonflikte zu ermöglichen.
 * 4. Singleton-Pattern: Stellt sicher, dass pro Applikationsinstanz nur eine
 *    Datenbankverbindung geöffnet wird.
 *
 * WARUM:
 * Ermöglicht SSG (Static Site Generation), ohne dass eine aktive Datenbank im
 * Build-Environment vorhanden sein muss, während im Betrieb maximale
 * SQLite-Performance garantiert wird.
 *
 * @version 1.1.0
 * ============================================================================
 */

import { existsSync, mkdirSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '../../db';

/**
 * Inferiert den Typ der Drizzle-Instanz für globale Verwendung.
 */
export type DbType = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DbType | null = null;

/**
 * Erstellt einen Proxy, der DB-Aufrufe während des Build-Vorgangs abfängt.
 * Gibt 'undefined' für Promises zurück, um Fehlinterpretationen zu vermeiden.
 *
 * SICHERHEIT: Gibt Warnungen aus, wenn während des Builds auf die DB zugegriffen wird.
 */
function createBuildProxy(): DbType {
  // biome-ignore lint/suspicious/noExplicitAny: Proxy mock
  const proxy: any = new Proxy(() => proxy, {
    get: (_, prop) => {
      // Promise-Handling für await
      if (prop === 'then') return (res: (v: unknown) => void) => res(undefined);

      // Warnung bei potentiell gefährlichen Zugriffen während des Builds
      // Read-Operationen (query, select) sind oft okay (z.B. für Static Paths),
      // aber Write-Operationen (insert, update, delete) sollten nie im Build passieren.
      const dangerousOps = ['insert', 'update', 'delete', 'run', 'execute'];
      if (typeof prop === 'string' && dangerousOps.includes(prop)) {
        console.warn(`[WARN] Build-Time DB Write Attempt: db.${prop}() called! This will be ignored but indicates logic leak.`);
      }

      return proxy;
    },
    apply: (_, __, args) => {
      // Falls der Proxy als Funktion aufgerufen wird
      return proxy;
    }
  });
  return proxy as unknown as DbType;
}

/**
 * Singleton-Getter für die DB-Instanz.
 * Unterscheidet strikt zwischen Build-Time (Proxy) und Runtime (Fail-Fast).
 */
export async function getDb(): Promise<DbType> {
  if (dbInstance) return dbInstance;

  // Harte Erkennung der Bun-Runtime zur Vermeidung von Silent Failures
  const isBunRuntime = typeof Bun !== 'undefined';

  if (!isBunRuntime) {
    // Falls 'bun:sqlite' nicht verfügbar ist (Build-Time / Node), nutze Proxy.
    return createBuildProxy();
  }

  // @ts-ignore - Bun-specific
  const { Database } = await import('bun:sqlite');

  // Hardening: Sicherstellen, dass das Datenverzeichnis existiert
  if (!existsSync('data')) {
    mkdirSync('data', { recursive: true });
  }

  // Ab hier: Echte Runtime. Fehler (Rechte, Pfade, Korruption) müssen crashen.
  const sqlite = new Database('data/sqlite.db');
  sqlite.exec('PRAGMA journal_mode = WAL;');
  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

// In HonoX / SSG context we might need a sync export for the top-level
// but for the real app we just need the instance.
// We'll use a lazy getter for the exported 'db' constant.
export const db = new Proxy({} as DbType, {
  get(_, prop) {
    if (!dbInstance) {
      const isBunRuntime = typeof Bun !== 'undefined';
      if (!isBunRuntime) return createBuildProxy()[prop as keyof DbType];
      
      // If we are here and dbInstance is null, someone accessed db before initialization in Bun.
      // This shouldn't happen with proper Hono routing, but we can try to sync-initialize if Bun is available.
      // @ts-ignore
      const { Database } = require('bun:sqlite');
      const sqlite = new Database('data/sqlite.db');
      sqlite.exec('PRAGMA journal_mode = WAL;');
      dbInstance = drizzle(sqlite, { schema });
    }
    return dbInstance[prop as keyof DbType];
  }
});
