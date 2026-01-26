# 🤖 AI Agents Guide - LEAN MEAN VPS

> **Kontext:** Du arbeitest an einem hochoptimierten System für Low-Resource Umgebungen. Jedes Byte RAM zählt.

## 🏗️ Architektur-Regeln (Strict)

### 1. Vertical Slices
*   **Neue Features** gehören IMMER in `app/modules/{feature-name}`.
*   **Niemals** Business-Logik in `app/core` packen. Core ist Infrastruktur.
*   **Module-Isolation:** Module dürfen keine Logik voneinander importieren. Nur `schema.ts` Imports (Type-Only) sind erlaubt.

### 2. UI Komponenten
*   **Atoms:** `app/core/ui` (Button, Input). Nur dumme, styled Elements.
*   **Islands:** `app/modules/{name}/islands`. Interaktive (Client-Side) Komponenten.
*   **Shared SSR:** `app/components`. Layouts, Header, Footer (Stateless).

### 3. Datenbank
*   Jedes Modul definiert sein eigenes Schema in `schema.ts`.
*   Vergiss nicht, das Schema in `app/db.ts` zu exportieren!
*   **Niemals** `bun:sqlite` direkt importieren. Nutze immer `app/core/db`.

## ⚡ Performance Guidelines

1.  **Keine WebSockets in JS:** Nutze IMMER `createBunWebSocket` und `ws.publish()` (Native Pub/Sub) für Broadcasts.
2.  **Auth Queue:** `verifyPassword` ist teuer. Nutze es niemals ungequeued in einer Schleife.
3.  **Streaming:** Datei-Uploads/Downloads müssen gestreamt werden (`Bun.file().stream()`). Kein `readFileSync`.

## 🔒 Security Mandates

1.  **CSRF:** Schreibende APIs (`POST`, `PUT`, `DELETE`) brauchen `csrfMiddleware`.
2.  **Zod:** Jeder Input muss durch einen Zod-Validator.
3.  **Timing Attacks:** Nutze Dummy-Verifikation im Login-Flow.

---

Verwende diese Richtlinien, um Code zu generieren, der den "Senior Engineer" Standards dieses Repos entspricht.
