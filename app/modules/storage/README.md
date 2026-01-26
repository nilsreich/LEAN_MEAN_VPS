# Storage Modul

Dateiverwaltung mit direktem Upload auf den VPS.

## 📦 Features
- Upload von Dateien (Multipart/Form-Data).
- Download via sicherem Streaming.
- Löschen von Dateien (DB + Filesystem).
- Metadaten-Speicherung in SQLite.

## 🛠️ API Endpunkte
- `GET /api/storage/list`: Liste der Dateien.
- `GET /api/storage/download/:id`: Download Stream.
- `POST /api/storage/upload`: Upload (Max 10MB).
- `DELETE /api/storage/:id`: Löschen.

## 🏗️ Implementierung
- **Filesystem:** Speichert unter `data/uploads/{uuid}`.
- **Safety:** Generiert UUIDs statt Originalnamen (verhindert Überschreiben/Path Traversal).
- **Bun:** Nutzt `Bun.write` und `Bun.file().stream()` für maximalen Durchsatz bei geringem RAM.
