# ADR-005: Database Schema Evolution via Versioned Flyway Migrations

## Status
**Accepted**

## Context
As an application matures across development, testing, staging, and production environments, database schema changes (tables, indexes, foreign keys) must be managed systematically without manual SQL scripts or unversioned JPA `ddl-auto` updates.

## Decision
We adopted **Flyway 10** for versioned, immutable SQL schema migrations (`V1` through `V10`).

## Rationale & Trade-offs

### Advantages:
- **Reproducible Environments**: Running Flyway migrations guarantees identical database schemas across local development, CI integration testing, and Docker production deployments.
- **Auditability**: Every schema change is explicitly recorded in Git with timestamp and author history.
- **Safety**: Hibernate `ddl-auto` is set to `validate` in production, ensuring Hibernate never alters database structure at runtime.

### Trade-offs & Consequences:
- **Immutable History**: Historical migrations (`V1`..`V9`) cannot be modified once applied; all schema evolutions must be added as forward migration scripts (e.g. `V10__academic_exams_schema.sql`).
