# Production Incident Response Runbook

This runbook provides actionable procedures for responding to production incidents in **Abhi.iterates-OS**.

---

## Incident Triage Matrix

| Incident Type | Severity | Primary Symptom | Response Lead |
|---------------|----------|-----------------|---------------|
| **Database Outage / Unavailability** | **P1 - CRITICAL** | Backend returns HTTP 503; logs show `CannotCreateTransactionException` | DevOps / DB Engineer |
| **Backend Container Crash Loop** | **P1 - CRITICAL** | Actuator `/actuator/health` fails; container constantly restarts | Platform Engineer |
| **Flyway Migration Failure** | **P1 - CRITICAL** | Backend fails on startup with `FlywayException` / Checksum mismatch | DB / DevOps Engineer |
| **External AI Provider Downtime** | **P2 - HIGH** | RAG Chat / Assessment generation fails; rest of app works | AI Infrastructure Lead |
| **Disk Space Exhaustion** | **P2 - HIGH** | Uploads fail with HTTP 500; PostgreSQL writes fail | DevOps Lead |

---

## Scenario 1: Database Outage / Unavailability (P1)

### Symptoms
- Clients receive HTTP 503 `Database service is temporarily unavailable`.
- Backend logs show `org.postgresql.util.PSQLException: Connection refused`.

### Diagnosis & Recovery Steps
1. **Check PostgreSQL Container Status**:
   ```bash
   docker compose ps postgres
   ```
2. **Inspect PostgreSQL Server Logs**:
   ```bash
   docker compose logs --tail=100 postgres
   ```
3. **Verify Host Memory & Disk Space**:
   ```bash
   free -h
   df -h
   ```
4. **Restart Database Container**:
   ```bash
   docker compose restart postgres
   ```
5. **Verify Database Health Check**:
   ```bash
   docker exec -t abhi-os-postgres pg_isready -U postgres
   ```

---

## Scenario 2: Backend Container Crash Loop (P1)

### Symptoms
- Container status shows `Restarting (1)`.
- HTTP endpoints time out or fail.

### Diagnosis & Recovery Steps
1. **Inspect Last Container Logs**:
   ```bash
   docker compose logs --tail=200 backend
   ```
2. **Check for Common Causes**:
   - **Missing Environment Variable**: Verify `JWT_SECRET`, `ADMIN_PASSWORD`, `SPRING_DATASOURCE_URL` are set.
   - **OutOfMemory (OOM)**: Check if container was killed by Linux OOM killer (`dmesg | grep -i oom`).
3. **Fix Configuration or Secrets in `.env`**:
   ```bash
   nano .env
   ```
4. **Re-launch Container**:
   ```bash
   docker compose up -d backend
   ```

---

## Scenario 3: Flyway Migration Failure (P1)

### Symptoms
- Backend startup aborts with `FlywayException: Validate failed: Migrations have failed validation`.

### Diagnosis & Recovery Steps
1. **Identify Failing Migration File**:
   ```bash
   docker compose logs backend | grep -A 5 "FlywayException"
   ```
2. **Do NOT Edit Already-Applied Migration Files** on production database.
3. **If Checksum Mismatch Occurred Due to File Formatting**:
   - If migration is idempotent and schema is intact, run Flyway repair via temporary container:
   ```bash
   docker run --rm --net=host -v $(pwd)/backend/src/main/resources/db/migration:/flyway/sql flyway/flyway:10 repair -url=jdbc:postgresql://localhost:5432/abhi_iterates_os -user=postgres -password=postgrespassword
   ```
4. **Restart Backend**:
   ```bash
   docker compose restart backend
   ```

---

## Scenario 4: AI Provider Unavailability / Degradation (P2)

### Symptoms
- AI Chat returns fallback error message ("AI service temporarily unavailable").
- Non-AI features (Academic subjects, study plans, sessions, assessments) continue working normally.

### Diagnosis & Recovery Steps
1. **Verify Core App Status**:
   - Confirm login, topics, study plans, and analytics remain operational (**AI is not a hard dependency for core app functionality**).
2. **Verify AI API Key & Quota**:
   - Check OpenAI / Groq status page for API outages.
   - Test API key validity using `curl`:
   ```bash
   curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
   ```
3. **Switch AI Provider / Model via `.env`**:
   ```bash
   # Update OPENAI_BASE_URL or OPENAI_MODEL in .env
   OPENAI_BASE_URL=https://api.groq.com/openai
   OPENAI_MODEL=llama-3.3-70b-versatile
   
   docker compose restart backend
   ```

---

## Scenario 5: File Upload / Disk Space Exhaustion (P2)

### Symptoms
- Attachment uploads fail with `Could not create the upload directory` or `No space left on device`.

### Diagnosis & Recovery Steps
1. **Check Disk Space Usage**:
   ```bash
   df -h /app/uploads
   ```
2. **Clean Unused Docker Images & Build Cache**:
   ```bash
   docker system prune -af --volumes
   ```
3. **Expand Host Volume / Disk Size** if physical storage is exhausted.
