# System Architecture & Technical Specification

This document details the architectural design, component interactions, data flow, provider specifications, security boundaries, and technical constraints of AbhiIterates.OS.

---

## 1. High-Level Architecture

```
[React 18 SPA Client]
        │ (HTTPS / REST & SSE)
        ▼
 [Nginx Reverse Proxy]
        │ (HTTP Port 8080)
        ▼
[Spring Boot 3.3.1 API (Java 21)]
        │
   ┌────┴───────────────────────────┬───────────────────────────┐
   │ (JPA / Flyway)                 │ (Spring AI VectorStore)   │ (Groq REST API / OpenAI REST API)
   ▼                                ▼                           ▼
[PostgreSQL 16 Relational DB]  [pgvector Vector Table]     [External AI Services]
  - users                       - ai_vector_store            - Groq: llama-3.3-70b-versatile
  - resources                     (HNSW Cosine Index)        - OpenAI: text-embedding-3-small
  - tasks                                                    - Google OAuth2
  - marketplace_listings                                     - Cloudinary (Optional media)
```

---

## 2. End-to-End Component Flow

### Frontend (Client Layer)
- **Framework**: React `18.3.1` bundled with Vite `5.4.8` and TypeScript `5.5.3`.
- **State Architecture**:
  - **Server State**: Managed by TanStack React Query (`v5.101.2`) handling asynchronous caching, optimistic UI updates, background revalidation, and retry logic.
  - **Client State**: Managed by Zustand (`v5.0.14`) for local UI state (theme preferences, active sidebar selection, active chat conversation state).
- **Web Server & Reverse Proxy**: Nginx `alpine` container serving compiled static assets (`/usr/share/nginx/html`) and reverse-proxying API calls (`/api/`) and SSE streams (`/api/v1/ai/chat/stream`) to the backend container.

### Backend (Core Application Layer)
- **Runtime & Framework**: Java `21` (Eclipse Temurin JRE) running Spring Boot `3.3.1`.
- **Security & Authorization**:
  - Stateless JWT authentication via `JwtAuthenticationFilter`. Access tokens expire in 15 minutes; refresh tokens expire in 7 days and use rotation with revocation tracking (`UserSessionRepository` and `RefreshTokenRepository`).
  - Server-side Role-Based Access Control (`ROLE_USER`, `ROLE_CREATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`) enforced at method level via `@PreAuthorize`.
- **Database Access & Migrations**: Spring Data JPA with Hibernate `6.5.2.Final`. Flyway `10.x` manages 12 versioned migration scripts (V1 through V12).

### Database & Vector Store Layer
- **Relational Database**: PostgreSQL `16.x` providing ACID transaction compliance for users, academic entities, tasks, resources, listings, notifications, and analytics.
- **Vector Storage**: `pgvector` extension installed on PostgreSQL 16. Vector data is stored in the `ai_vector_store` table:
  - `id`: UUID Primary Key
  - `content`: Document chunk text
  - `metadata`: JSONB containing enriched fields (`userId`, `resourceId`, `filename`)
  - `embedding`: `vector(1536)`
- **Indexing**: Hierarchical Navigable Small World (`HNSW`) index using cosine distance (`vector_cosine_ops`) initialized via Flyway V12 migration script.

### AI Provider & RAG Pipeline Layer
- **LLM Provider**: Groq API using `llama-3.3-70b-versatile` over its OpenAI-compatible endpoint (`https://api.groq.com/openai`). Secret keys (`GROQ_API_KEY`) remain strictly on the backend.
- **Embedding Provider**: OpenAI API using `text-embedding-3-small` returning 1536-dimensional float vectors.
- **Tenant Isolation**: All similarity search queries pass a `FilterExpressionBuilder` condition enforcing `user_id = :userId` metadata matching.

---

## 3. Technology Stack & Component Versions

| Tier | Component | Provider / Tool | Version | Configured Scope |
|---|---|---|---|---|
| **Runtime** | JDK | Eclipse Temurin | `21` | Application execution environment |
| **Backend** | Framework | Spring Boot | `3.3.1` | REST endpoints, Security, Transactions |
| **AI Layer** | AI Abstraction | Spring AI | `1.0.0` | ChatClient & PgVectorStore integration |
| **Database** | RDBMS | PostgreSQL | `16` | Relational entity storage |
| **Vector DB** | Vector Extension | pgvector | `pg16` | HNSW cosine similarity vector storage |
| **Migrations** | DDL Engine | Flyway | `10.x` | Schema migrations V1-V12 |
| **LLM Inference**| Groq Cloud API | `llama-3.3-70b-versatile` | Cloud | SSE streaming chat & topic tutoring |
| **Embeddings** | OpenAI API | `text-embedding-3-small` | Cloud | 1536-dimensional document embeddings |
| **Frontend** | UI Framework | React | `18.3.1` | Client view layer |
| **Build Tool** | Bundler | Vite | `5.4.8` | Client asset compilation |
| **Language** | Type System | TypeScript | `5.5.3` | Type safety across client codebase |
| **Data Fetching**| Async Query | TanStack Query | `5.101.2` | Data fetching, caching, optimistic state |
| **Proxy** | Web Server | Nginx | `alpine` | SPA routing & backend API reverse proxy |

---

## 4. Architectural Safeguards & Security Boundaries

1. **Backend Secret Encapsulation**: The frontend never receives `GROQ_API_KEY`, `OPENAI_API_KEY`, or `JWT_SECRET`.
2. **Fail-Fast Secret Validation**: Spring Boot startup fails fast immediately if `JWT_SECRET`, `ADMIN_EMAIL`, or `ADMIN_PASSWORD` are absent or empty.
3. **Multi-Tenant Data Isolation**: Database queries use explicit user ownership filters (`WHERE user_id = :userId`). Vector search queries append JSONB metadata filter expressions (`user_id = :userId`).
4. **Privilege Escalation Protection**: Non-`SUPER_ADMIN` accounts are prohibited from creating or modifying `SUPER_ADMIN` accounts or reserved system configuration settings.

---

## 5. Scope Boundaries & What is NOT Implemented

To eliminate ambiguity, the following capabilities are explicitly **NOT** implemented in this version:

1. **Automated Payment Gateway Integration**: No Stripe, PayPal, or Razorpay SDKs are integrated. Campus marketplace checkout displays a static UPI ID string for peer-to-peer manual payments.
2. **Local GPU/LLM Inference**: The system does not bundle local Ollama or vLLM container models in standard deployment; it relies on external Groq/OpenAI cloud API keys.
3. **Multi-Provider OAuth2 SSO**: Only Google OAuth2 ID token authentication is configured.
4. **Realtime Audio/Video Conferencing**: Study rooms support document annotations, drawing canvas, and timer tools; they do not include WebRTC audio/video calling.
