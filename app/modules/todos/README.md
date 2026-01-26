# Todos Modul

Einfaches Aufgaben-Management für authentifizierte Benutzer.

## 📦 Features
- Erstellen, Auflisten, Löschen von Todos
- Status-Toggle (Erledigt/Offen)
- **Offline-Support:** Änderungen werden lokal in die Queue geschrieben und später gesynct.
- **Optimistic UI:** Sofortiges Feedback für den Nutzer.

## 🛠️ API Endpunkte
- `GET /api/todos`: Liste aller Todos.
- `POST /api/todos`: Neues Todo `{ content: string }`.
- `PATCH /api/todos/:id/toggle`: Status ändern (Atomar).
- `DELETE /api/todos/:id`: Löschen.

## 🏗️ Implementierung
- **Schema:** `todos` Tabelle mit Foreign Key auf `users`.
- **Validation:** Zod Schemas für Content und IDs.
- **Performance:** Single-Query Toggle (`sql` Expression).
