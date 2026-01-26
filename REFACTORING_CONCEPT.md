# Konzept: Modulare Lean-Architektur

Dieses Konzept beschreibt die Transformation des **LEAN MEAN VPS** Templates in ein wiederverwendbares Framework mit klarer Trennung zwischen Kern-Funktionalität ("Core") und anwendungsspezifischer Logik ("Modules").

**Ziel:** Maximale Modularität bei **identischer Performance** (Zero-Runtime-Overhead).

---

## 1. Die neue Ordnerstruktur

Wir wechseln von einer "Schichten-Architektur" (Controller/DB/Views getrennt) zu einer **"Vertical Slice Architektur"**. Alles, was zu einem Feature gehört, liegt nah beieinander.

```text
app/
├── core/                  # 🔥 Das unveränderliche Framework
│   ├── auth/              # Auth-Logik, Middleware, Session-Schema
│   ├── db/                # DB-Verbindung (index.ts)
│   ├── ui/                # Basis-Komponenten (Button, Card, Layout)
│   └── lib/               # Shared Utilities (Result Types, Hash)
│
├── modules/               # 📦 Deine Features (leicht löschbar/austauschbar)
│   ├── todos/
│   │   ├── schema.ts      # Nur Todo-Tabellen
│   │   ├── api.ts         # Todo API-Endpunkte
│   │   └── islands/       # Todo-UI (Interactive)
│   │
│   └── storage/
│       ├── schema.ts
│       ├── api.ts
│       └── islands/
│
├── routes/                # 🚦 Routing & Pages (HonoX SSG)
│   ├── api/               # Mount-Point für Modul-APIs
│   ├── index.tsx          # Landing Page
│   └── dashboard.tsx      # Dashboard
│
└── db.ts                  # Zentraler Schema-Export (für Drizzle)
```

---

## 2. Implementierungs-Details

### A. Datenbank (Drizzle Modularisierung)
Anstatt einer riesigen `schema.ts`, definiert jedes Modul seine eigenen Tabellen. Eine zentrale Datei führt diese zusammen.

**`app/modules/todos/schema.ts`**
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from '../../core/auth/schema'; // Referenz auf Core

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  // ...
});
```

**`app/db.ts` (Zentraler Export)**
```typescript
// Core Tables
export * from './core/auth/schema';

// Module Tables (Manuelle Registrierung)
export * from './modules/todos/schema';
export * from './modules/storage/schema';
```
*Vorteil:* Wenn du das "Todos"-Feature löschen willst, löschst du den Ordner `app/modules/todos` und entfernst eine Zeile in `app/db.ts`. Sauber.

### B. Routing (API Aggregation)
Hono-Instanzen werden in den Modulen definiert und im Hauptserver gemounted.

**`app/modules/todos/api.ts`**
```typescript
const app = new Hono<Env>();
app.get('/', ...);
app.post('/', ...);
export default app;
```

**`app/routes/api/index.ts`**
```typescript
import todoRoutes from '../../modules/todos/api';

const app = new Hono();
app.route('/todos', todoRoutes);
// app.route('/blog', blogRoutes); // Einfach erweiterbar
```

### C. UI & Islands
UI-Komponenten, die nur für ein Feature relevant sind, wandern direkt in den Modul-Ordner. Nur generische UI-Elemente (Buttons, Inputs) bleiben in `core/ui`.

---

## 3. Lean & Sauber bleiben

Wie garantieren wir, dass die Modularisierung nicht zu "Bloat" führt?

1.  **Strenge Regel:** Keine zyklischen Abhängigkeiten zwischen Modulen. Modul A darf Modul B nicht direkt importieren. Kommunikation erfolgt über die Datenbank oder Events (falls nötig).
2.  **Core ist heilig:** Code im `core/`-Ordner sollte so generisch sein, dass er in *jedem* Projekt unverändert bleiben kann.
3.  **Static Imports:** Wir nutzen keine dynamischen "Auto-Loader" (die Verzeichnisse scannen). Das kostet beim Starten Millisekunden. Wir importieren Module explizit (`import ... from ...`). Das ist minimal mehr Tipparbeit, aber extrem performant und typesafe.

## 4. Workflow für neue Projekte

Wenn dieses Refactoring umgesetzt ist, sieht der Start eines neuen Projekts so aus:

1.  Repo klonen.
2.  Ordner `app/modules/todos` löschen (da nur Beispiel).
3.  Zeile in `app/db.ts` entfernen.
4.  Neuen Ordner `app/modules/blog` anlegen.
5.  Loslegen.

Das System bleibt **so schlank wie vorher**, aber die mentale Last ("Was kann weg?") ist massiv reduziert.
