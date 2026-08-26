# Production Deployment Guide

This guide provides step-by-step instructions for deploying **Abhi.iterates-OS** to a production environment.

---

## 1. Environment Requirements & Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 22.04 LTS, Debian 12, or RHEL 9 recommended)
- **CPU**: 2 vCPU minimum
- **RAM**: 4 GB minimum
- **Disk**: 20 GB free SSD storage

### Installed Software Prerequisites
- **Docker Engine**: v24.0+
- **Docker Compose**: v2.20+
- **Git**: v2.30+

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure mandatory production environment variables:

| Variable | Requirement | Example / Production Value |
|----------|-------------|----------------------------|
| `POSTGRES_DB` | Mandatory | `abhi_iterates_os` |
| `POSTGRES_USER` | Mandatory | `abhi_user` |
| `POSTGRES_PASSWORD` | Mandatory (Strong secret) | `c9f3a8...` |
| `JWT_SECRET` | Mandatory (64+ chars) | `openssl rand -base64 64` |
| `ADMIN_EMAIL` | Mandatory | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Mandatory | `YourStrongAdminP@ssword123` |
| `OPENAI_API_KEY` | Mandatory for AI features | `sk-proj-...` |
| `CORS_ALLOWED_ORIGINS` | Mandatory | `https://yourdomain.com` |

---

## 3. Production Profile Setup (`application-prod.yml`)

The Spring Boot backend uses `SPRING_PROFILES_ACTIVE=prod`.

Key production settings enforced by `application-prod.yml`:
- **Hibernate DDL Auto**: Set to `validate` (schema mutations performed strictly via Flyway migrations).
- **Hikari Connection Pool**: Maximum pool size 20, idle timeout 300s, max lifetime 1200s, leak detection threshold 2000ms.
- **SQL Logging**: `show-sql: false` and `format_sql: false` to prevent log bloat.
- **Flyway Migrations**: Executed automatically on startup (`flyway.enabled=true`).

---

## 4. Single-Command Docker Deployment

Deploy all services (PostgreSQL + pgvector, Spring Boot API, Nginx React SPA) using Docker Compose:

```bash
# 1. Build container images
docker compose build

# 2. Start services in detached mode
docker compose up -d

# 3. Verify running containers and health status
docker compose ps
```

### Health Check Verification

- **PostgreSQL**: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`
- **Backend API**: `http://localhost:8080/actuator/health` (returns `{"status":"UP"}`)
- **Frontend SPA**: `http://localhost:3000/` (returns HTTP 200 OK)

---

## 5. Reverse Proxy & HTTPS Configuration

In production, terminate TLS at a front-facing reverse proxy (e.g. Nginx, Caddy, or Cloudflare Tunnel) before routing to the Docker host on port `3000` or `8080`.

Example Caddyfile for automatic Let's Encrypt HTTPS:

```caddy
yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 6. Backup & Recovery Strategy

### Database Backups (PostgreSQL)

Run daily PostgreSQL database dumps:

```bash
docker exec -t abhi-os-postgres pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Document Uploads Backup

Backup the persistent uploads volume directory:

```bash
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/abhi-iterates-os_uploads_data/_data
```

---

## 7. Rollback Procedure

In case of a failed deployment or application regression:

```bash
# 1. Roll back container images to previous tag/commit SHA
docker compose down

# 2. Deploy previous application image tag
docker compose up -d --no-build

# 3. Run smoke test to verify recovery
./scripts/smoke-test.sh
```

---

## 8. Troubleshooting

| Issue | Probable Cause | Resolution |
|-------|----------------|------------|
| Backend container fails on startup | Missing mandatory `JWT_SECRET` or `ADMIN_PASSWORD` | Ensure `.env` contains valid secrets and run `docker compose up -d` |
| Database connection error | PostgreSQL container initializing | `depends_on` wait condition handles DB readiness. Check `docker compose logs postgres` |
| Flyway checksum mismatch | Migration file modified post-apply | Repair Flyway schema history table or restore DB backup |
| AI Chat returns 500 error | Invalid or missing `OPENAI_API_KEY` | Verify API key in `.env` and restart backend container |
