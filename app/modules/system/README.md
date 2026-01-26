# System Events Modul

Real-time Monitoring der Server-Metriken.

## 📦 Features
- Sendet periodische Updates (RAM, Uptime, Time).
- Nutzt Server-Sent Events (SSE) statt WebSockets (leichter).

## 🛠️ API Endpunkte
- `GET /api/events/stats`: SSE Stream.

## 🏗️ Implementierung
- **Hono SSE:** Nutzt `streamSSE` Helper.
- **Interval:** Sendet alle 5 Sekunden Daten.
- **Auth:** Geschützt durch `authMiddleware` (keine öffentlichen Stats).
