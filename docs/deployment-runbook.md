# Production Deployment Runbook

This runbook outlines the 10-step process for deploying an update to **Abhi.iterates-OS** in production.

---

## Pre-Deployment Verification

- [ ] All CI workflow jobs passed on `main` branch.
- [ ] No breaking changes in Flyway migration files (`backend/src/main/resources/db/migration/`).
- [ ] Staging / local smoke tests executed successfully.

---

## 10-Step Production Deployment Process

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 1. Git Sync │──►│ 2. Env Verification │──►│ 3. Build Container │──►│ 4. Pre-Check DB │──►│ 5. DB Migration │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                                               │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│ 10. Audit Log│◄──│ 9. Post-Check│◄──│ 8. Smoke Test│◄──│ 7. Deploy Containers│◄───────┘
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### Step 1: Pull Latest Main Branch

```bash
git checkout main
git pull origin main
```

### Step 2: Verify Production Environment Secrets

Ensure `.env` contains valid production secrets:

```bash
# Verify mandatory environment variables are non-empty
grep -E 'JWT_SECRET|ADMIN_PASSWORD|POSTGRES_PASSWORD|OPENAI_API_KEY' .env
```

### Step 3: Build Docker Container Images

```bash
docker compose build --no-cache
```

### Step 4: Verify PostgreSQL Health & Connectivity

```bash
docker exec -t abhi-os-postgres pg_isready -U postgres
```

### Step 5: Execute Database Migrations (Automated via Flyway)

Flyway runs automatically when the backend container starts. To verify migration status prior to traffic cutover, launch the backend service:

```bash
docker compose up -d backend
docker compose logs -f backend | grep -i "flyway"
```

Expected log output: `Successfully applied N migrations to schema "public"`.

### Step 6: Deploy Frontend Container

```bash
docker compose up -d frontend
```

### Step 7: Verify Container Readiness & Health Endpoints

```bash
# Check Actuator Health
curl -s http://localhost:8080/actuator/health | grep '"status":"UP"'

# Check Frontend SPA Index
curl -I http://localhost:3000/
```

### Step 8: Execute Deployment Smoke Test

Run the automated deployment smoke test script:

```bash
./scripts/smoke-test.sh
```

Expected output: `SMOKE TEST PASSED: All deployment checks successful.`

### Step 9: Monitor Application Logs

Inspect backend logs for unhandled runtime exceptions or connection pool warnings:

```bash
docker compose logs -f --tail=100 backend
```

### Step 10: Record Release Tag & Audit Log

Tag the deployment in Git:

```bash
git tag -a v1.0.0-prod -m "Production release v1.0.0"
git push origin v1.0.0-prod
```

---

## Immediate Rollback Procedure

If the smoke test fails or container health checks time out:

```bash
# 1. Stop updated containers
docker compose down

# 2. Start previous image version
docker compose up -d --no-build

# 3. Verify recovery via health endpoint
curl -s http://localhost:8080/actuator/health
```
