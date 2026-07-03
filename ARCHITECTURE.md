# Architecture Decision Records — AbhiIterates.OS

This document records every significant architectural decision made during development,
including the context, decision, reasoning, and consequences.

Architecture decisions are permanent record. They are never deleted — only superseded.

---

## ADR-001: Monorepo Structure

**Date:** 2026-07-04
**Status:** Accepted

### Context
The project has three distinct runtimes: a React frontend, a Spring Boot backend, and a Python AI service. We needed to decide between a monorepo (all services in one repository) and a polyrepo (each service in its own repository).

### Decision
Use a monorepo with three top-level service directories: `frontend/`, `backend/`, `ai-service/`.

### Reasoning
- **Atomic commits:** A feature often spans frontend + backend. One PR, one commit, one review cycle.
- **Shared context:** Documentation, design decisions, and API contracts are visible to all services.
- **Simpler CI/CD at MVP:** One repository means one GitHub Actions workflow with path-based triggers.
- **Easier onboarding:** A new contributor clones one URL and sees the entire system.

### Consequences
- Build times increase as the codebase grows. Mitigated by path-based CI triggers.
- Branch management becomes slightly more complex. Mitigated by strict naming conventions.
- If independent scaling is needed, services are extracted to polyrepo. The module boundaries in our code will make this straightforward.

---

## ADR-002: Modular Monolith over Microservices

**Date:** 2026-07-04
**Status:** Accepted

### Context
The backend could be built as microservices (separate deployable services per domain) or as a modular monolith (one deployable with internal module boundaries).

### Decision
Build the backend as a **Modular Monolith** with strict inter-module boundaries.

### Reasoning
Microservices solve operational problems that do not yet exist at MVP stage:
- We have no team requiring independent deployment pipelines.
- We have no proven traffic patterns requiring independent scaling.
- We have no need for polyglot persistence per service.

Microservices would introduce:
- Network latency between services for every request.
- Distributed transaction complexity.
- Multiple deployment units to manage and monitor.
- Service discovery infrastructure overhead.

A modular monolith gives us:
- **Module isolation:** Each domain (auth, library, marketplace, ai, notification) lives in its own package with clean interfaces.
- **Zero extraction cost:** When we grow and need to split a service, the module boundary already exists. We add a network interface and deploy it separately. This is a days-long task, not a months-long refactor.
- **Simple local development:** One `./mvnw spring-boot:run` command.
- **Testability:** Integration tests can cross module boundaries without mocking HTTP.

### Consequences
- Single point of failure for the backend. Acceptable at MVP stage. Mitigated by Railway auto-restart.
- Entire backend must be redeployed for any change. Acceptable at MVP stage.
- Must enforce module boundaries through code review and package structure. Cyclic dependencies are a risk.

---

## ADR-003: PostgreSQL as Primary Database

**Date:** 2026-07-04
**Status:** Accepted

### Context
We needed a relational database for structured data (users, resources, purchases, subscriptions, highlights, bookmarks) and a store for vector embeddings (for AI features).

### Decision
Use **PostgreSQL 16** as the single primary database via Neon (serverless Postgres).

### Reasoning
- Strong ACID guarantees for financial transactions (payments, purchases).
- JSON support for flexible metadata fields without schema changes.
- **pgvector** extension enables vector similarity search, eliminating the need for a separate vector database for MVP.
- Neon provides a serverless, auto-scaling, branch-per-PR developer experience.
- Spring Data JPA has first-class PostgreSQL support.

### Consequences
- Vector search performance at large scale requires migration to a dedicated vector DB (Pinecone, Weaviate, Qdrant). This is a Phase 3 concern.
- Schema migrations require careful planning. Handled by Flyway (introduced in Day 4).

---

## ADR-004: JWT with Refresh Token Rotation

**Date:** 2026-07-04
**Status:** Accepted

### Context
We needed a stateless authentication strategy that supports secure session management across web clients.

### Decision
Short-lived access tokens (15 minutes) + long-lived refresh tokens (30 days) with **rotation on every refresh**.

### Reasoning
- **Access token lifetime:** 15 minutes limits the damage window if a token is stolen. No network call is needed for most requests (stateless validation).
- **Refresh token rotation:** Each time a refresh token is used, it is invalidated and a new one is issued. If a stolen refresh token is used, the legitimate user's next refresh will fail (detecting theft). We then invalidate the entire refresh token family.
- **Database-backed refresh tokens:** Refresh tokens are stored in PostgreSQL, enabling true invalidation (logout, device management, theft detection). Access tokens remain stateless.

### Consequences
- Slightly more complex client implementation (must handle 401 and retry with refresh).
- Refresh token storage adds a database lookup on every token refresh. Acceptable — refresh happens at most once per 15 minutes.

---

## ADR-005: Supabase Storage for MVP, Cloudflare R2 for Production

**Date:** 2026-07-04
**Status:** Accepted

### Context
We need object storage for PDFs, user avatars, and creator-uploaded resources. The storage layer must support signed URLs (time-limited, authenticated access) for DRM-like protection.

### Decision
Use **Supabase Storage** for MVP (free tier, RLS policies, signed URLs). Migrate to **Cloudflare R2** for production (no egress fees, S3-compatible API).

### Reasoning
- Supabase provides RLS (Row Level Security) on storage out of the box. We never serve raw public URLs for purchased content.
- Signed URLs with short expiry (5–15 minutes) serve as a practical DRM deterrent. We cannot prevent screen recording in a browser, but we can prevent direct URL sharing.
- Cloudflare R2 is chosen for production because it has zero egress fees. At scale, egress costs on AWS S3 or Supabase become significant.
- The S3-compatible API of R2 means our backend code does not change during migration — only the endpoint and credentials change.

### Consequences
- Migration from Supabase to R2 requires a one-time data migration script and credential swap. Planned and documented before reaching that scale.

---

## ADR-006: Redis for Caching and Rate Limiting

**Date:** 2026-07-04
**Status:** Accepted

### Context
We need in-memory caching for frequently accessed data (resource listings, user profiles) and rate limiting for authentication endpoints and AI calls.

### Decision
Use **Redis** via **Upstash** (serverless Redis, HTTP-based, no persistent connection management).

### Reasoning
- Authentication endpoints (login, register) must be rate-limited to prevent brute force.
- AI Chat endpoints consume LLM tokens. Rate limiting prevents cost abuse.
- Resource listing pages are expensive database queries. Redis cache with 60-second TTL dramatically reduces DB load.
- Upstash is chosen over self-hosted Redis because it requires zero infrastructure management at MVP stage.

### Consequences
- Cache invalidation must be handled carefully. Stale reads are a risk on write operations. We use a **cache-aside** pattern with explicit invalidation.

---

## ADR-007: Feature-Based Frontend Folder Structure

**Date:** 2026-07-04
**Status:** Accepted

### Context
Frontend codebases typically use either type-based structure (`components/`, `pages/`, `hooks/`) or feature-based structure (`features/auth/`, `features/library/`).

### Decision
**Feature-based structure** inside `src/features/`, shared code in `src/shared/`.

### Reasoning
Type-based structure collapses at scale. When a feature spans components, hooks, types, and API calls, you navigate across 5 folders to find related files. Feature-based structure co-locates everything a feature needs. Deleting a feature is a single folder deletion.

### Consequences
- Some code belongs to multiple features (auth tokens used across all features). This goes in `src/shared/` with clear ownership.
- Requires discipline to not create a god `shared/` folder. If something is used by only one feature, it belongs in that feature.

---

*New decisions are added as numbered ADRs. Existing ADRs are never modified — only superseded by a new ADR referencing the old one.*
