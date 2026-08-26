# Release Process & Versioning Policy

This document defines the release workflow, versioning policy, and deployment lifecycle for **Abhi.iterates-OS**.

---

## 1. Branching & Release Strategy

```
  feature/xyz ──(Pull Request)──> develop ──(PR / Merge)──> main ──(Tag vX.Y.Z)──> Production
```

- `main`: Production-ready code. Every merge to `main` must pass full CI testing.
- `develop`: Integration branch for active development.
- `feature/*`: Short-lived feature branches created from `develop`.

---

## 2. Release Lifecycle Steps

### Step 1: Feature Completion & Local Testing
- All feature work must include unit/integration tests.
- Backend compilation, test suite, and frontend build must pass locally (`./mvnw clean test`, `npm run build`).

### Step 2: Pull Request & Automated CI Verification
- Open PR targeting `develop` or `main`.
- GitHub Actions CI runner (`.github/workflows/ci.yml`) automatically executes:
  1. PostgreSQL 16 + pgvector container initialization
  2. Flyway migration execution (`V1` to `V11`)
  3. Spring Boot compilation & test suite (`mvn clean test -B`)
  4. Node 22 TypeScript compilation & Vite production build (`npm run build`)

### Step 3: Semantic Version Tagging
- Tags follow Semantic Versioning (`vMAJOR.MINOR.PATCH`).
  - `v1.0.0`: Initial production release
  - `v1.1.0`: Feature release (e.g. new planner engine enhancement)
  - `v1.0.1`: Patch release (e.g. security fix, performance patch)

Create release tag:

```bash
git tag -a v1.0.0-prod -m "Production release v1.0.0-prod"
git push origin v1.0.0-prod
```

### Step 4: Production Deployment & Smoke Testing
- Operator executes 10-step deployment runbook (`docs/deployment-runbook.md`).
- Run automated deployment smoke test (`./scripts/smoke-test.sh`).

---

## 3. Version Tracking & Changelog Management

Every release updates `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format with categories:
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Fixed` for any bug or performance fixes.
- `Security` for vulnerability fixes.
