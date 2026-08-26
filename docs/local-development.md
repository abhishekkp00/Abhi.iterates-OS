# Local Development Guide

This guide walks a new developer through cloning, configuring, building, running, and testing **Abhi.iterates-OS** from scratch on a clean machine.

---

## 1. Prerequisites

Ensure your development workstation has:
- **Java JDK**: Version 21 (Temurin / OpenJDK)
- **Node.js**: Version 22.x + npm
- **Docker Engine & Docker Compose**: Docker 24+
- **Git**: 2.30+

Verify installed versions:

```bash
java -version
node -v
docker --version
```

---

## 2. Quick-Start (One-Command Docker Compose)

To launch the complete application stack (PostgreSQL + pgvector, Backend API, Frontend SPA) in local containers:

```bash
# 1. Clone repository
git clone https://github.com/abhishekkp00/Abhi.iterates-OS.git
cd Abhi.iterates-OS

# 2. Copy environment template
cp .env.example .env

# 3. Launch full stack
docker compose up --build
```

Access local endpoints:
- **Frontend SPA**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`
- **Swagger API Docs**: `http://localhost:8080/swagger-ui.html`
- **Actuator Health**: `http://localhost:8080/actuator/health`

---

## 3. Local Development (IDE + Docker Postgres)

For active coding, run PostgreSQL in Docker while running backend and frontend in local IDE / terminal.

### Step 1: Start PostgreSQL + pgvector Container

```bash
docker compose up -d postgres
```

### Step 2: Run Backend Service (Spring Boot 3.3)

```bash
cd backend
cp ../.env.example .env
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend starts on port `8080` (or configured `PORT`). Flyway automatically runs database migrations `V1` through `V11`.

### Step 3: Run Frontend Application (React + Vite)

In a separate terminal window:

```bash
cd frontend
npm ci
npm run dev
```

The Vite dev server starts on `http://localhost:5173` (or `http://localhost:5180`).

---

## 4. Running Unit & Integration Tests

### Run Backend Security & Domain Tests

```bash
cd backend
./mvnw clean test
```

Run specific test suites:

```bash
# Run security test suite
./mvnw test -Dtest=*Security*

# Run RAG evaluation test suite
./mvnw test -Dtest=RagEvaluationTest
```

### Run Frontend Type Check & Build Validation

```bash
cd frontend
npm run build
```

---

## 5. Seed Accounts & Test Credentials

On initial startup, Flyway migrations and `DatabaseSeeder` provision initial administrator credentials:

- **Admin Email**: `admin@abhiiterates.os` (or value of `ADMIN_EMAIL`)
- **Admin Password**: `AdminPassword123!` (or value of `ADMIN_PASSWORD`)

Student accounts can be registered freely via the UI or `POST /api/v1/auth/register`.
