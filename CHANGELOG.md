# Changelog

All notable changes to **Abhi.iterates-OS** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-prod] - 2026-08-26

### Added
- **Production Deployment Suite**: Full multi-stage Docker build pipeline (`backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`).
- **Database Migrations**: Automated Flyway migration pipeline `V1` through `V11` including pgvector embedding extensions and covering performance indexes.
- **Security Hardening**: Service-layer IDOR protection, pgvector `WHERE user_id = :userId` data isolation, `<academic_context>` prompt injection wrapping, and IP-based sliding window rate limiting (`RateLimiterService`).
- **Automated Security Integration Tests**: 34 automated integration tests covering IDOR, cross-user RAG isolation, prompt injection, and file upload protection.
- **DevOps & Release Documentation**: Architecture specifications, deployment decisions, operator runbooks, incident response playbooks, and automated deployment smoke test script (`scripts/smoke-test.sh`).

### Changed
- **Performance Optimization**: Eliminated 400+ N+1 SQL queries in `LearningStateServiceImpl`, `AcademicDashboardServiceImpl`, and `StudyPlanRepository` via bulk loading and `JOIN FETCH` queries.
- **Non-Root Container Security**: Hardened backend container image to run as non-root `appuser:appgroup` with container-aware JVM flags (`-XX:MaxRAMPercentage=75.0`).
- **Frontend SPA Nginx Configuration**: Reverse proxy API routing with SSE streaming buffering disabled (`proxy_buffering off`) and direct route refresh support (`try_files`).
