# 🚀 LEAN MEAN VPS Template (2026 Edition)

Das ultimative Framework für **Fullstack Bun-Apps** auf minimalistischer Hardware.

## ✨ Highlights
- **Runtime**: Bun (Fast & Native)
- **Framework**: HonoX (Islands Architecture + SSR/SSG)
- **Database**: SQLite + Drizzle ORM (WAL Mode)
- **Styling**: TailwindCSS 4 (OKLCH, modernste Syntax)
- **Sicherheit**: Argon2id, Session-DB, CSRF-Tokens
- **Footprint**: Läuft stabil auf **512MB RAM**

## 📂 Dokumentation
Eine ausführliche Beschreibung der Architektur und API findest du in der [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🛠️ Schnellstart

### 1. Installation
```bash
bun install
```

### 2. Entwicklung
```bash
bun run dev
```

### 3. Build & Production
```bash
bun run build
bun run start
```

## 🏗️ Projekt-Struktur
- `app/routes/`: Page-Routen (SSR/SSG)
- `app/islands/`: Interaktive Client-Komponenten
- `app/api/`: REST Endpunkte
- `app/db/`: Datenbank-Layer
- `data/`: SQLite und Datei-Uploads

---

**LEAN MEAN VPS** - Gebaut für Effizienz. [Agents Guide](./agents.md)
