# AliOS Architecture

AliOS 1.0 is a local-first static web app.

## Core Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible components
- IndexedDB via Dexie
- Repository Pattern
- Storage Adapter
- AIProvider Interface without real AI integration in v1

## Runtime Rule

AliOS does not require a Node.js server in production. Node.js is allowed for development, dependency installation, and building static assets.

## Layering

```text
UI Layer
↓
Feature Layer
↓
Application / Use-case Layer
↓
Repository Layer
↓
Storage Adapter Layer
↓
Dexie / IndexedDB in v1
```

## Non-goals in v1

- No OpenAI API
- No Supabase
- No backend
- No auth
- No vector database
- No semantic search
- No plugins
- No event system
