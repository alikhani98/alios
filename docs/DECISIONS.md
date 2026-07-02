# Architecture Decision Records

## ADR-001: Use Vite instead of Next.js

Reason:

- Static output
- No production Node.js server requirement
- Better fit for shared hosting
- Simpler local-first architecture

## ADR-002: Use IndexedDB/Dexie instead of Supabase

Reason:

- Zero monthly cost
- No external service dependency
- Offline-first
- Good fit for a single-user local app

## ADR-003: Use Repository Pattern from day one

Reason:

- Keeps UI independent from storage implementation
- Allows future migration to SQLite, PHP/MySQL, or another storage adapter

## ADR-004: AI-ready without AI integration

Reason:

- Core app must work without AI
- Future providers such as Manual AI, Ollama, OpenAI, or Custom API can be added later

## ADR-005: Feature-based architecture

Reason:

- Features can evolve independently
- Reduces long-term coupling
