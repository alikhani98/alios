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

## ADR-006: Minimize abstractions until they solve a current need

Decision:

> New abstractions are only allowed when there is a concrete current need, not a hypothetical future need. Prefer direct, simple implementation unless at least two real implementations exist or an immediate approved stage requires the boundary.

Reason:

- Do not add new Service, Port, Adapter, Manager, or Engine layers unless current functionality justifies them.
- Future flexibility alone is not enough reason to introduce another boundary.
- The existing Repository and Storage Adapter layers remain approved and in place.
- New abstractions should be minimized and tied to demonstrable present requirements.
