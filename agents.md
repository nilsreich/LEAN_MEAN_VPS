# 🤖 AI Agents Dokumentation - LEAN MEAN VPS Template

> Richtlinien für AI-Agenten zur Arbeit mit diesem Framework.

## 📋 Projekt-Philosophie (2026 Edition)

Dieses Template ist auf **absolute Effizienz** getrimmt. Ziel ist ein Fullstack-System, das auf einem **512MB RAM VPS** stabil läuft und gleichzeitig modernste Sicherheitsstandards erfüllt.

### Kern-Prinzipien
1. **SSG First**: Seiten werden statisch generiert (HonoX SSG).
2. **SQLite WAL**: Datenbank ist lokal, typsicher (Drizzle) und performant.
3. **No Bloat**: Keine unnötigen Bibliotheken. Tailwind 4 + Bun native APIs.
4. **Islands**: Client-JS nur dort, wo Interaktion stattfindet.

---

## 🏗️ Architektur-Flows (Sequence Diagrams)

### 1. Signup & Auth Flow
```mermaid
sequenceDiagram
    participant U as User (Island)
    participant A as Auth API
    participant D as SQLite (Drizzle)

    U->>A: POST /register (Username, Pwd)
    A->>D: Check existing user
    A->>A: Hash Pwd (Argon2id)
    A->>D: Insert User
    A-->>U: 200 OK
    
    U->>A: POST /login
    A->>D: Fetch User Hash
    A->>A: Verify Hash
    A->>D: Create Session & CSRF Token
    A->>A: Create Session & CSRF Token
    A-->>U: 200 OK + Cookies
```

### 2. Datenbank-Zugriff & CRUD
```mermaid
sequenceDiagram
    participant U as User (Island)
    participant M as Auth Middleware
    participant T as Todo API
    participant D as SQLite

    U->>T: GET /api/todos (Cookie: SessionID)
    T->>M: Validate SessionID
    M->>D: Check Session ID
    M-->>T: Continue (User Context)
    T->>D: SELECT * FROM todos WHERE userId = X
    D-->>T: Result Set
    T-->>U: JSON Response
```

### 3. File Storage (Lean Design)
```mermaid
sequenceDiagram
    participant U as User
    participant S as Storage API
    participant FS as File System (data/uploads)
    participant D as SQLite (Metadaten)

    U->>S: POST /upload (File + CSRF)
    S->>S: Validate CSRF & Size
    S->>FS: Bun.write(uuid, file)
    S->>D: INSERT INTO uploads (id, filename, size)
    S-->>U: 200 OK
```

---

## 🔧 Coding Conventions für Agents

- **Kommentare**: Jede Datei MUSS oben einen Header haben (WAS, WIE, WARUM).
- **Security**: Nutze IMMER die `authMiddleware` und `csrfMiddleware` für schreibende API-Zugriffe.
- **UI**: Nutze ausschließlich die Komponenten aus `app/components/UI.tsx`. Keine In-Line Styles.
- **Framework**: HonoX für Routing & SSG, Bun für Runtime & Hashing.

