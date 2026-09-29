# Local Development & Contributing Guide

This guide details the local setup, development workflows, testing procedures, and environment configuration for developers working on AbhiIterates.OS.

---

## 1. Environment Prerequisites

Before starting, ensure your local development workstation has the following installed:

- **Java Development Kit (JDK)**: OpenJDK 21 or Eclipse Temurin 21+ (`java -version`)
- **Build Tool**: Apache Maven 3.9+ or use the provided wrapper (`./mvnw`)
- **Node.js Environment**: Node.js `22.x` and npm `10.x` (`node -v` / `npm -v`)
- **Container Engine**: Docker Desktop or Docker Engine with Docker Compose (`docker compose version`)

---

## 2. Local Setup Workflow

### Step 1: Clone Repository & Create Environment Configuration
```bash
git clone https://github.com/abhishekkp00/Abhi.iterates-OS.git
cd Abhi.iterates-OS
cp .env.example .env
```
Edit `.env` to configure your development secrets (`JWT_SECRET`, `ADMIN_PASSWORD`, `GROQ_API_KEY`, `OPENAI_API_KEY`).

### Step 2: Start PostgreSQL with pgvector Extension
Run the PostgreSQL service in detached mode:
```bash
docker compose up postgres -d
```
Verify the container is healthy:
```bash
docker compose ps
```

### Step 3: Start the Backend Service (Spring Boot 3.3.1)
```bash
cd backend
mvn spring-boot:run
```
The backend API will run at `http://localhost:8080`.
Flyway will automatically apply DB migrations V1 through V12 on startup.

### Step 4: Start the Frontend Application (React 18 + Vite 5)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will be accessible at `http://localhost:5173`.

---

## 3. Testing Procedures

### Backend Unit & Integration Tests (JUnit 5 + Mockito)
```bash
cd backend
mvn test
```
- Executes 273 unit and integration tests across security, auth, RAG, productivity, marketplace, analytics, and admin modules.
- Runs `EndToEndJourneyIntegrationTest` executing all 18 end-to-end user journeys.

### Frontend Typecheck & Production Build
```bash
cd frontend
npm test        # Runs TypeScript compilation verification (tsc -b)
npm run build   # Compiles production assets into dist/
```

---

## 4. Code Formatting & Development Guidelines

1. **API Contracts**: All REST endpoints must return `ApiResponse<T>` wrappers. Never return raw un-wrapped entity domain objects.
2. **Secrets Security**: Never commit `.env` or hardcode secret keys in `.java`, `.ts`, or `.yml` files. All required secrets must use environment variable injection.
3. **Database Migrations**: Never modify existing Flyway migration files (`V1` through `V12`). Always create a new versioned Flyway SQL script (`V13__description.sql`) for schema alterations.
