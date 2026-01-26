/**
 * ============================================================
 * LEAN MEAN VPS - Drizzle Kit Konfiguration
 * ============================================================
 * 
 * Konfiguration für Drizzle ORM Migrations
 * 
 * @author LEAN_MEAN_VPS
 * @version 1.0.0
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  /* Schema-Pfad */
  schema: "./app/db/schema.ts",
  /* Output-Verzeichnis für Migrations */
  out: "./drizzle",
  /* Datenbank-Dialekt */
  dialect: "sqlite",
  /* DB-Verbindung */
  dbCredentials: {
    url: "data/sqlite.db",
  },
});
