# 📖 LEAN MEAN VPS - Umfassende Dokumentation

Willkommen in der Dokumentation des **LEAN MEAN VPS** Templates (Edition 2026). Dieses Dokument bietet einen tiefen Einblick in die Architektur, Entscheidungsgrundlagen und Nutzung des Frameworks.

---

## 🎯 Vision & Philosophie

Das Ziel dieses Templates ist es, eine **Fullstack-Entwicklungserfahrung** zu bieten, die auf minimalistischster Hardware (z.B. ein 5 Euro/Monat VPS mit 512MB RAM) eine exzellente Performance und Sicherheit liefert.

### Kernprinzipien:
1.  **Zero-Bloat**: Jede hinzugefügte Bibliothek muss ihren Platz im 512MB RAM Limit rechtfertigen.
2.  **Native Power**: Bevorzugung von Bun-nativen APIs (Hashing, SQLite, File I/O).
3.  **Modern UI**: Nutzung von TailwindCSS 4 (OKLCH, CSS-Variablen) für maximale Design-Flexibilität bei minimalem CSS-Footprint.
4.  **Security First**: Keine Kompromisse bei der Sicherheit (Argon2id, Session-DB, CSRF, HttpOnly Cookies).

---

## 🏗️ Architektur-Übersicht

Das Framework basiert auf **HonoX**, einem modernem Framework für Hono, das eine "Islands-Architektur" nutzt.

### 1. Dateisystem-Struktur
- `app/server.ts`: Der Haupteinstiegspunkt für den SSR-Server.
- `app/routes/`: Hier liegen die HonoX-Routen. Dateien mit `.tsx` werden serverseitig gerendert.
- `app/islands/`: Client-seitige interaktive Komponenten (Hydration).
- `app/db/`: Datenbank-Schema und Initialisierung (Drizzle + SQLite).
- `app/middleware/`: Sicherheitsrelevante Logik (Auth, CSRF, Rate-Limiting).
- `data/`: Permanenter Speicher für die SQLite-Datenbank und Uploads.

### 2. Datenhaltung (SQLite + Drizzle)
Wir nutzen **SQLite im WAL-Modus** (Write-Ahead Logging). Dies ermöglicht extrem schnelle Lese- und Schreibzugriffe bei minimalem Speicherverbrauch.
- **Drizzle ORM**: Bietet volle Typsicherheit für SQL-Abfragen.
- **Build Proxy**: Ein spezieller Mechanismus in `app/db/index.ts` sorgt dafür, dass Vite während des Builds (unter Node.js) nicht über Bun-native APIs stolpert.

---

## 🔐 Sicherheits-Konzept

### Authentifizierung
Wir nutzen keine einfachen JWT-Cookies, sondern ein **datenbankgestütztes Session-System**:
1.  **Session-ID**: Ein zufälliger UUID-String wird in einem `HttpOnly`, `Secure`, `SameSite=Lax` Cookie gespeichert.
2.  **Session-Store**: Die Session wird serverseitig in der SQLite-Datenbank validiert (`app/db/schema.ts`). Dies erlaubt sofortige Revokation (Logout).
3.  **Passwort-Hashing**: Argon2id via `Bun.password`.

### CSRF-Schutz
Alle schreibenden API-Anfragen (`POST`, `PUT`, `DELETE`) erfordern einen `X-CSRF-Token` Header. Dieser Token wird beim Login generiert und ist an die Session gebunden.

---

## 🎨 UI & Design (Tailwind 4)

Das Template nutzt **TailwindCSS 4**. 
- **Farben**: Definierte OKLCH-Variablen erlauben saubere Transparenzen und modernste Farbtöne.
- **Komponenten**: Die Datei `app/components/UI.tsx` enthält standardisierte Elemente (Button, Input, Card, Badge), die für das gesamte System genutzt werden sollten.

---

## 🚀 Deployment & Optimierung

### Build-Prozess
1.  **SSG**: Statische Routen werden während des Builds generiert.
2.  **Bun-Binary**: Das gesamte System kann in eine einzige ausführbare Datei kompiliert werden:
    ```bash
    bun run build
    ```

### VPS Setup (Empfehlung)
- **OS**: Ubuntu 24.04 LTS
- **Runtime**: Bun 1.x
- **Reverse Proxy**: Caddy (einfacher als Nginx, automatisch SSL)
- **Process Manager**: Systemd oder `bun --hot`

---

## 🛠️ API Referenz

### Auth API
- `POST /api/auth/register`: Erstellt einen neuen User.
- `POST /api/auth/login`: Startet eine Session.
- `POST /api/auth/logout`: Zerstört die Session.

### Todo API
- `GET /api/todos`: Listet eigene Todos.
- `POST /api/todos`: Erstellt Todo.
- `PATCH /api/todos/:id`: Status ändern.

### Storage API
- `POST /api/storage/upload`: Datei-Upload (Multipart).
- `GET /api/storage/download/:id`: Sicherer Datei-Download.

---

## 📈 Skalierung
Obwohl für 512MB RAM optimiert, kann das System durch den Einsatz von SQLite WAL und Bun problemlos Tausende gleichzeitige Anfragen verarbeiten, bevor ein Hardware-Upgrade nötig wird.
