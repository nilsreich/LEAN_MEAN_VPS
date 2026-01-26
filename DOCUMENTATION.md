# 📘 LEAN MEAN VPS - Framework Dokumentation (v2.0)

Ein Walkthrough für Entwickler: Architektur, Funktionsweise und Deployment.

---

## 🏗️ Architektur & Funktionsfluss

Das Framework basiert auf dem **Vertical Slice** Prinzip mit einer strikten Trennung zwischen **Core** (Infrastruktur) und **Modules** (Features).

### 1. Request Flow (Vom Browser zur DB)
1.  **Caddy (Reverse Proxy):** Empfängt Request (443), terminiert SSL, prüft Rate-Limits.
2.  **Bun (Runtime):** Startet den Server (`app/api-server.ts`).
3.  **Hono (Router):**
    *   Matcht `/api/*` -> Leitet an Module weiter (z.B. `app/modules/todos/api.ts`).
    *   Matcht `*` -> Liefert statisches HTML aus (`dist/`).
4.  **Middleware (`app/core/auth/middleware.ts`):**
    *   Validiert Session-Cookie gegen SQLite DB.
    *   Setzt `user` Context.
5.  **Handler (Modul API):** Führt Business-Logik aus (z.B. Todo erstellen).
6.  **Drizzle (ORM):** Generiert SQL -> Führt Query auf `data/sqlite.db` (WAL Mode) aus.

### 2. Projektstruktur
```text
app/
├── core/                  # 🛡️ UNANTASTBAR (Framework-Basis)
│   ├── auth/              # Login, Register, Session-Cleanup
│   ├── db/                # DB-Verbindung & Mocking
│   ├── ui/                # Generische Komponenten (Button, Card)
│   └── lib/               # Shared Utils (Zod Schemas, Offline-Sync)
│
├── modules/               # 📦 DEINE FEATURES (Business Logic)
│   ├── todos/             # Beispiel: Task-Manager
│   ├── storage/           # Beispiel: File-Upload
│   └── system/            # Beispiel: SSE Monitoring
│
├── routes/                # 🚦 Frontend Routing (HonoX)
│   └── ...                # Pages (.tsx)
│
└── db.ts                  # Zentraler Schema-Export
```

### 3. Core vs. Modules
*   **Core:** Enthält alles, was für *jede* App nötig ist (Auth, DB-Connection). Ändere dies nur selten.
*   **Modules:** Hier lebst du. Ein Modul enthält seine eigene API (`api.ts`), sein Datenbankschema (`schema.ts`) und seine UI-Komponenten (`islands/`).
    *   *Regel:* Um ein Modul zu löschen, lösche einfach den Ordner und entferne den Import in `app/db.ts` und `app/api-server.ts`.

---

## 🛠️ Deep Dive: Spezielle Konzepte

### SQLite Mock & SSG (Warum?)
**Frage:** *Brauche ich den `bun-sqlite-mock` wirklich?*
**Antwort:** Ja, für den Build-Prozess.
*   **Problem:** Vite (unser Build-Tool) führt Code teilweise in einer Node.js-ähnlichen Umgebung aus, um statisches HTML zu generieren (SSG). `bun:sqlite` ist aber eine native Bun-API, die in Node crasht.
*   **Lösung:** Der Proxy in `app/core/db/index.ts` erkennt, wenn wir nicht in Bun laufen, und liefert ein "Dummy"-Objekt zurück. So läuft der Build durch, ohne dass eine echte DB-Verbindung nötig ist.
*   **Best Practice:** Erst DB erstellen (`bun x drizzle-kit push`), dann Build. Aber der Mock garantiert, dass der *Code* auch ohne DB importierbar ist.

### Vite Config & Low-Resource
Die `vite.config.ts` ist bereits auf `esbuild` (extrem schnell/sparsam) eingestellt.
*   **Tuning:** Für 512MB RAM ist keine weitere Änderung nötig. Bun managed den Speicher sehr effizient.

---

## 🚀 Operations Guide (VPS Setup)

Dein VPS (z.B. 5€/Monat, 512MB RAM) sollte so eingerichtet werden:

### 1. Caddy (Reverse Proxy)
Caddy ist effizienter als Nginx bei SSL und Kompression.
Installiere Caddy und nutze dieses `Caddyfile`:

```caddyfile
deine-domain.com {
    # 1. Kompression (Gzip/Zstd) - Spart Bandbreite
    encode zstd gzip

    # 2. Hard Rate Limiting (DDoS Schutz)
    # Erlaubt 10 Requests pro Sekunde pro IP
    rate_limit {
        zone lean_vps_limit {
            key {remote_host}
            events 10
            window 1s
        }
    }

    # 3. Security Headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }

    # 4. Proxy zur Bun App
    reverse_proxy localhost:3000
}
```
*Tipp:* Rate-Limiting im Framework (`middleware/rateLimit.ts`) ist gut für User-Logik, aber Caddy schützt den Server *bevor* Node/Bun Last erzeugt.

### 2. Systemd Service (Autostart)
Erstelle `/etc/systemd/system/lean-app.service`:

```ini
[Unit]
Description=Lean Mean VPS App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/lean-app
# Nutze das kompilierte Binary für max. Performance
ExecStart=/var/www/lean-app/lean-server
Restart=always
# RAM Limit (Sicherheitsnetz)
MemoryMax=400M

[Install]
WantedBy=multi-user.target
```

### 3. Deployment Steps
1.  Lokal: `bun run build`
2.  Upload: Kopiere `lean-server` und den `dist/` Ordner auf den VPS.
3.  VPS: `systemctl restart lean-app`.

---

## 💡 Developer FAQ

**Wie füge ich eine Tabelle hinzu?**
1.  Erstelle `app/modules/mein-feature/schema.ts`.
2.  Exportiere sie in `app/db.ts`.
3.  Führe `bun db:push` aus.

**Wo sind die WebSockets?**
Wir nutzen **Server-Sent Events (SSE)** in `app/modules/system/api.ts`.
*   *Warum?* WebSockets halten eine TCP-Verbindung dauerhaft offen (teuer bei vielen Usern). SSE ist One-Way (Server -> Client) über HTTP und deutlich ressourcenschonender für Status-Updates.

**Wie sicher ist das?**
*   **Auth:** Argon2id (Standard).
*   **Session:** DB-backed + Probabilistisches Cleanup (1% Chance bei Login).
*   **Timing Attacks:** Login-Verzögerung ist durch Dummy-Hash-Check angeglichen.
