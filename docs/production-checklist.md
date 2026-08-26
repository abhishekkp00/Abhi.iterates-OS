# Master Production Readiness Checklist

This checklist must be verified prior to deploying **Abhi.iterates-OS** to production.

---

## 1. Configuration & Security

- [x] **Production Profile Configured**: `SPRING_PROFILES_ACTIVE=prod` specified in container runtime.
- [x] **Secrets Externalized**: `JWT_SECRET`, `ADMIN_PASSWORD`, `POSTGRES_PASSWORD`, `OPENAI_API_KEY` injected via `.env` / environment variables. No secrets committed to version control.
- [x] **CORS Allowed Origins Enforced**: Explicit production origin set in `CORS_ALLOWED_ORIGINS` (e.g. `https://yourdomain.com`). No wildcard origins in production.
- [x] **Actuator Endpoints Secured**: Only `/actuator/health` and `/actuator/info` exposed; sensitive endpoints restricted to `ROLE_ADMIN` (`SecurityConfig.java`).
- [x] **Error Output Sanitized**: Internal exception messages and stack traces suppressed in REST responses (`server.error.include-stacktrace=never`).

---

## 2. Database & Migrations

- [x] **PostgreSQL 16 + pgvector Available**: Database container/host initialized with pgvector extension.
- [x] **Flyway Automated Migrations**: Schema migrations `V1` through `V11` execute automatically on backend startup.
- [x] **Hibernate DDL Auto Set to Validate**: `spring.jpa.hibernate.ddl-auto=validate` in `application-prod.yml`.
- [x] **Database Backup Strategy Documented**: Daily `pg_dump` procedure documented in `docs/deployment.md`.

---

## 3. Container & Runtime Hardening

- [x] **Multi-Stage Build**: `backend/Dockerfile` and `frontend/Dockerfile` use multi-stage builds.
- [x] **Non-Root User Execution**: Backend container runs as non-root `appuser:appgroup` (`backend/Dockerfile`).
- [x] **JVM Container Memory Limits**: JVM configured with `-XX:+UseG1GC`, `-XX:MaxRAMPercentage=75.0`, and `-XX:+ExitOnOutOfMemoryError`.
- [x] **Health Check Configured**: Docker Compose health checks configured for PostgreSQL (`pg_isready`) and Backend (`/actuator/health`).
- [x] **Persistent Volume Mounts**: Persistent block storage volumes configured for `/var/lib/postgresql/data` (`postgres_data`) and `/app/uploads` (`uploads_data`).

---

## 4. Frontend & SPA Routing

- [x] **Static SPA Serving**: Vite production bundle compiled to `/dist` and served via lightweight Nginx container (`nginx:alpine`).
- [x] **SPA Direct Route Refresh**: `nginx.conf` handles direct navigation and page refresh via `try_files $uri $uri/ /index.html`.
- [x] **API Reverse Proxy**: Nginx routes `/api/` to backend container on port `8080`.
- [x] **SSE Streaming Buffering Disabled**: `proxy_buffering off` configured for AI SSE streaming endpoints.

---

## 5. Verification & Testing

- [x] **CI Pipeline Passing**: GitHub Actions workflow (`.github/workflows/ci.yml`) passes compilation, integration tests, and frontend build.
- [x] **34 Automated Security Integration Tests Passing**: IDOR, cross-user RAG isolation, prompt injection XML wrapping, file upload validation.
- [x] **Deployment Smoke Test Script**: Executable smoke test script `scripts/smoke-test.sh` created and verified.
- [x] **Deployment & Incident Runbooks**: Detailed runbooks created (`docs/deployment-runbook.md`, `docs/incident-runbook.md`).
