/**
 * ============================================================================
 * LEAN MEAN VPS - Database Bootstrapper
 * ============================================================================
 *
 * WAS:
 * Initialisierung und Export der zentralen Datenbankinstanz (Drizzle + LibSQL).
 *
 * WIE:
 * 1. Runtime-Detection: Erkennt dynamisch, ob die Anwendung in der Bun-Runtime
 *    oder während des statischen Builds (Node.js) ausgeführt wird.
 * 2. Mocking/Proxying: Implementiert ein Proxy-basiertes Mocking-System für
 *    den Build-Prozess. Dies verhindert Abstürze beim Zugriff auf native
 *    APIs während des Vite-Bundlings.
 * 3. LibSQL: Nutzt @libsql/client für verbesserte Performance und Kompatibilität.
 * 4. Optimierung: Erstellt die 'sessions' Tabelle manuell mit 'WITHOUT ROWID'
 *    für maximale Key-Value Performance.
 *
 * WARUM:
 * Ermöglicht SSG (Static Site Generation), ohne dass eine aktive Datenbank im
 * Build-Environment vorhanden sein muss, während im Betrieb maximale
 * Performance garantiert wird.
 *
 * @version 1.2.0
 * ============================================================================
 */

import { existsSync, mkdirSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
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
        console.warn(
          `[WARN] Build-Time DB Write Attempt: db.${prop}() called! This will be ignored but indicates logic leak.`,
        );
      }

      return proxy;
    },
    apply: (_, __, args) => {
      // Falls der Proxy als Funktion aufgerufen wird
      return proxy;
    },
  });
  return proxy as unknown as DbType;
}

/**
 * Singleton-Getter für die DB-Instanz.
 * Unterscheidet strikt zwischen Build-Time (Proxy) und Runtime.
 */
export async function getDb(): Promise<DbType> {
  if (dbInstance) return dbInstance;

  // Harte Erkennung der Bun-Runtime zur Vermeidung von Silent Failures
  const isBunRuntime = typeof Bun !== 'undefined';

  if (!isBunRuntime) {
    // Falls Runtime nicht verfügbar ist (Build-Time / Node), nutze Proxy.
    return createBuildProxy();
  }

  // Hardening: Sicherstellen, dass das Datenverzeichnis existiert
  if (!existsSync('data')) {
    mkdirSync('data', { recursive: true });
  }

  const client = createClient({ url: 'file:data/sqlite.db' });

  // Optimierung: 'sessions' Tabelle als reiner Key-Value Store ohne ROWID
  // Dies muss manuell geschehen, da Drizzle dies (noch) nicht nativ unterstützt.
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        key TEXT PRIMARY KEY,
        value BLOB
      ) WITHOUT ROWID;
    `);
  } catch (e) {
    console.error('[DB] Failed to ensure KV optimizations:', e);
  }

  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Lazy Getter für die exportierte 'db' Konstante.
export const db = new Proxy({} as DbType, {
  get(_, prop) {
    if (!dbInstance) {
      const isBunRuntime = typeof Bun !== 'undefined';
      if (!isBunRuntime) return createBuildProxy()[prop as keyof DbType];

      // Lazy Init für Runtime (ohne Async Setup - dieses sollte via getDb() beim Start erfolgen)
      const client = createClient({ url: 'file:data/sqlite.db' });
      dbInstance = drizzle(client, { schema });
    }
    return dbInstance[prop as keyof DbType];
  },
});
