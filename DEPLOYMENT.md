# Production Deployment & Operations Guide

This document details the production deployment architecture, Docker Compose runtime setup, environment secret isolation, fail-fast validation policies, and GitHub Actions CI/CD automation.

---

## 1. Production Architecture Overview

The system is deployed using **Docker Compose** orchestrating three isolated services:

```
                  ┌────────────────────────┐
                  │   Internet / Clients   │
                  └───────────┬────────────┘
                              │ Port 3000 / 80
                              ▼
        ┌───────────────────────────────────────────┐
        │  frontend (Nginx Alpine + React SPA)       │
        └─────────────────────┬─────────────────────┘
                              │ (frontend_network)
                              ▼
        ┌───────────────────────────────────────────┐
        │  backend (Spring Boot 3.3.1 / Java 21)    │
        └─────────────────────┬─────────────────────┘
                              │ (backend_network)
                              ▼
        ┌───────────────────────────────────────────┐
        │  postgres (PostgreSQL 16 + pgvector)      │
        └───────────────────────────────────────────┘
```

### Network Isolation Policy
- **`backend_network`**: Private bridge network connecting `postgres` and `backend`. PostgreSQL is not connected to `frontend_network` or exposed publicly.
- **`frontend_network`**: Private bridge network connecting `frontend` and `backend`. Nginx reverse-proxies REST API requests (`/api/`) to `http://backend:8080/api/`.

---

## 2. Docker Compose Configuration (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: abhi-os-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-abhi_iterates_os}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-abhi_iterates_os}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: abhi-os-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${PORT:-8080}:8080"
    environment:
      PORT: 8080
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB:-abhi_iterates_os}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@abhiiterates.os}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      GROQ_API_KEY: ${GROQ_API_KEY}
      GROQ_BASE_URL: ${GROQ_BASE_URL:-https://api.groq.com/openai}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_BASE_URL: ${OPENAI_BASE_URL:-https://api.openai.com}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:8080,http://localhost:5173,http://localhost:5180}
    volumes:
      - uploads_data:/app/uploads
    networks:
      - backend_network
      - frontend_network
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: abhi-os-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    networks:
      - frontend_network
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:80/ || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5

networks:
  backend_network:
    driver: bridge
  frontend_network:
    driver: bridge

volumes:
  postgres_data:
  uploads_data:
```

---

## 3. Production Secret Management & Fail-Fast Validation

1. **No Hardcoded Secrets**: All sensitive values (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `GROQ_API_KEY`, `OPENAI_API_KEY`) are injected via environment variables.
2. **Fail-Fast Validation**:
   - **`JwtTokenProvider`**: Throws an `IllegalStateException` on startup if `JWT_SECRET` is null, empty, or under 32 bytes (256 bits).
   - **`DatabaseSeeder`**: Throws an `IllegalStateException` on startup if `ADMIN_EMAIL` or `ADMIN_PASSWORD` are blank, terminating the container immediately before serving traffic.

---

## 4. GitHub Actions CI/CD Pipeline

The GitHub Actions workflow ([.github/workflows/ci.yml](file:///home/abhishek/Projects/Abhi.Iterates-OS/.github/workflows/ci.yml)) executes an 8-step automated pipeline:

1. **Checkout**: `actions/checkout@v4`
2. **Backend Build**: `mvn clean compile -B`
3. **Backend Tests**: `mvn test -B` (with `pgvector/pgvector:pg16` service container)
4. **Frontend Install**: `npm ci`
5. **Frontend Tests**: `npm test` (`tsc -b`)
6. **Frontend Build**: `npm run build`
7. **Docker Build**: `docker compose build`
8. **Optional Image Push**: Pushes built container images if `DOCKER_REGISTRY_USER` and `DOCKER_REGISTRY_PASSWORD` secrets exist.

---

## 5. Operations & Health Monitoring

- **Backend Health Check**: `GET http://localhost:8080/actuator/health` returns `{"status": "UP"}`.
- **Frontend Health Check**: `GET http://localhost:3000/` returns HTTP `200 OK`.
- **Database Status**: `pg_isready -U postgres -d abhi_iterates_os` checks PostgreSQL readiness.
