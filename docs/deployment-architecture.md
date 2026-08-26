# Production Deployment Architecture

This document describes the production deployment architecture for **Abhi.iterates-OS**.

---

## 1. Architecture Overview

**Abhi.iterates-OS** is deployed as a containerized **Modular Monolith** using Docker Compose or single-instance Container PaaS (e.g. AWS ECS Single-Task, Render, Railway, or Linux VM with Docker Engine).

```
                            [ CLIENT BROWSER ]
                                    │
                                 (HTTPS)
                                    ▼
                         ┌────────────────────┐
                         │  NGINX WEB SERVER  │
                         │  (Frontend Container)
                         └──────────┬─────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │                           │
              (Static SPA Files)           (API Reverse Proxy)
                      │                           │
                      ▼                           ▼
            ┌──────────────────┐        ┌──────────────────┐
            │  React SPA App   │        │ Spring Boot API  │
            │ (HTML/JS/Assets) │        │ (Backend Container)
            └──────────────────┘        └─────────┬────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────────────┐
                      │                           │                           │
                      ▼                           ▼                           ▼
           ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
           │ PostgreSQL + pgvector│     │ Local File Storage  │     │ External AI Provider│
           │  (Database Service) │     │ (uploads_data Vol)  │     │ (OpenAI / Groq API) │
           └─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## 2. Component Responsibilities

| Component | Technology | Primary Function | Scale Strategy |
|-----------|------------|------------------|----------------|
| **Frontend Proxy** | Nginx (`nginx:alpine`) | Serves compiled React SPA static assets, routes client SPA URLs to `index.html`, and reverse-proxies `/api/` requests to backend container with SSE support. | Single instance / CDN edge |
| **Backend API** | Spring Boot 3.3 (Java 21 JRE) | Core application business logic, JWT authentication, academic planner, assessment engine, RAG retrieval orchestration, and Flyway database migrations. | Single instance |
| **Database** | PostgreSQL 16 + pgvector (`pgvector/pgvector:pg16`) | Relational data persistence (users, subjects, topics, study plans, sessions) and vector embedding similarity search (`rag_document_chunk_embeddings`). | Single primary node with automated volume snapshots |
| **Persistent Volume** | Host Volume / Cloud Block Storage | Stores uploaded student attachments (`/app/uploads`) and PostgreSQL data files (`/var/lib/postgresql/data`). | Block storage volume (`uploads_data`, `postgres_data`) |
| **AI Provider** | OpenAI / Groq API | External LLM inference for natural language tutoring and assessment question generation. | External managed API |

---

## 3. Network Boundaries & Security Isolation

- **Public Internet Boundary**:
  - Ports `80` (HTTP) and `443` (HTTPS) exposed via Nginx reverse proxy / Cloud TLS termination.
- **Internal Container Bridge Network (`abhi-os-network`)**:
  - Backend communicates with PostgreSQL via container-internal host `postgres:5432`. PostgreSQL is NOT exposed to the public internet in production.
  - Backend communicates with external AI provider via outbound HTTPS (`api.openai.com` / `api.groq.com`).
- **Storage Isolation**:
  - Backend runs as a non-root user (`appuser`). Write access is restricted to the `/app/uploads` volume.

---

## 4. Statefulness & Scaling Characteristics

1. **Stateless API Runtime**:
   - Authentication relies entirely on stateless JWT bearer tokens.
   - Backend instances require no HTTP session replication.
2. **Stateful Dependencies**:
   - **PostgreSQL + pgvector**: Holds canonical database state and vector embeddings.
   - **Persistent Uploads Volume**: Holds raw uploaded PDF/attachment files.
   - **In-Process Sliding Window Rate Limiter**: Holds active rate-limiting buckets in memory (`RateLimiterService`). Running multiple backend instances behind a load balancer would require a distributed store (e.g. Redis) for global rate limiting; for current deployment scale, single-instance deployment ensures 100% rate-limiting accuracy without external dependencies.
