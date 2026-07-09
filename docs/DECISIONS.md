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

## ADR-007: Keep Finance local, small, and additive

Decision:

- Finance stores only transactions and obligations in local IndexedDB tables
- Finance UI talks to storage through the existing feature, repository, and storage-adapter boundaries
- Backup/restore must remain backward-compatible with older backups that do not contain finance arrays

Reason:

- The first Finance module should be useful without turning into banking, accounting, or advice software
- Keeping the model small preserves the existing local-first architecture and leaves room for later budgeting or debt tools if they are explicitly approved

## ADR-008: Keep Finance review informational and non-advisory

Decision:

- Finance review panels may summarize current-month spending, obligations, remaining liquidity, and simple budget pressure from entered local data
- Finance review must stay deterministic, local-only, and neutral
- Finance review must not become a chart system, automation engine, financial advice engine, or bank-integrated workflow

Reason:

- The review layer should help the user understand their own local data without implying financial advice
- A neutral summary keeps the feature aligned with the local-first, single-user, static-hosting model

## ADR-009: Keep Finance charts lightweight and dependency-free

Decision:

- Finance charts use existing React, CSS, and SVG patterns only
- Finance charts summarize local entered Finance data only and remain descriptive
- Finance charts must not introduce a chart library, animation library, forecasting layer, or advice engine

Reason:

- Lightweight charts keep the Finance module compatible with static hosting and the existing UI stack
- Avoiding a chart library preserves the local-first boundary and reduces maintenance overhead for a small visualization foundation
