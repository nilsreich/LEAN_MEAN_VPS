# 🚀 LEAN MEAN VPS Template (2026 Edition)

Das Referenz-Framework für **High-Performance Fullstack Applikationen** auf minimalistischer Hardware.

> **Zielgruppe:** Senior Engineers, die maximale Effizienz aus 1 vCPU & 512MB RAM herausholen wollen.
> **Stack:** Bun, HonoX, SQLite (WAL), Drizzle, Tailwind 4.

## ⚡ Key Technical Specs

| Feature | Technologie | Warum? |
| :--- | :--- | :--- |
| **Runtime** | **Bun** (v1.2+) | Native WebSockets, schnellere Startup-Time als Node.js, integrierter Bundler. |
| **Architecture** | **Vertical Slices** | Strikte Trennung: `core` (Infra) vs. `modules` (Features). Skaliert besser als Layered Arch. |
| **Database** | **SQLite (WAL)** | Kein externer DB-Prozess (spart ~100MB RAM). WAL-Mode erlaubt High-Concurrency Reads. |
| **Realtime** | **Bun Native Pub/Sub** | C++ basierte WebSockets. Vermeidet JS-Loop-Overhead bei 5000+ Connections. |
| **Security** | **Argon2id + Queue** | Memory-Hard Hashing, geschützt durch `p-limit` Queue gegen OOM-Kills. |
| **Frontend** | **HonoX Islands** | Zero-JS by default. JS wird nur für interaktive "Islands" hydriert. |

## 📂 Projektstruktur

```bash
app/
├── core/                  # 🛡️ Infrastructure (Auth, DB, Base UI)
├── modules/               # 📦 Feature Vertical Slices
│   ├── chat/              # Realtime Chat (Bun WS)
│   ├── tasks/             # CRUD Example
│   └── storage/           # File Uploads (Streaming)
├── components/            # 🧱 Shared SSR Components (Stateless)
├── islands/               # 🏝️ Global Interactive Islands
└── api-server.ts          # 🚀 Production Entrypoint
```

## 🛠️ Setup & Deployment

### 1. Installation
```bash
bun install
```

### 2. Entwicklung
Startet Vite (Frontend) und Hono (Backend Proxy).
```bash
bun run dev
```

### 3. Production Build
Kompiliert TypeScript zu optimiertem JS und Assets.
```bash
bun run build
# Startet den Server (benötigt Caddy davor für SSL/Gzip!)
bun run start
```

## 📚 Dokumentation

*   [**Technical Whitepaper**](./DOCUMENTATION.md): Tiefer Einblick in Architektur, Performance-Benchmarks und Sicherheitskonzepte.
*   [**Agents Guide**](./agents.md): Richtlinien für KI-Assistenten.
*   [**Code Review Report**](./CODE_REVIEW.md): Audit des aktuellen Stands.

---

**Built for Effizienz.** Keine unnötigen Abstraktionen. Type-Safe von der DB bis zum DOM.
