# Scalability, Best Practices & Project Structure — AbhiIterates.OS

---

## Section 1: Future Scalability Plan

### 100 Users (Current: MVP Launch)

**Database:** Single Neon PostgreSQL instance (free tier)
**Strategy:** No optimization needed yet
**Focus:** Correctness, not performance
- All indexes in place from day one (prevents expensive retrofitting)
- Connection pool: 10 connections max
- Redis: single Upstash instance, 256MB
- Storage: Supabase free tier (1GB)
- No query optimization needed

---

### 1,000 Users

**Triggers:** Noticeable latency on marketplace browse, dashboard loads
**Actions:**
- Enable Neon autoscaling (scales compute on demand)
- Add `EXPLAIN ANALYZE` to slow query log — identify missing indexes
- Upgrade Redis to 1GB
- Enable Supabase CDN for thumbnails (already public bucket)
- Add application-level connection pooling (HikariCP — already default in Spring Boot)
- Dashboard widget endpoint: cache with Redis (60s TTL)

---

### 10,000 Users

**Triggers:** Marketplace search becomes slow, highlight writes create lock contention, AI usage spikes
**Actions:**
- **Read replicas:** Add one Neon read replica for marketplace browse and search queries. Write queries stay on primary.
- **Separate AI write path:** `ai_usage` increments move to Redis counters, synced to PostgreSQL every 5 minutes via batch job
- **Highlight writes:** Queue to Redis, batch-insert every 10 seconds (trades slight delay for write throughput)
- **Full-text search:** Evaluate migrating marketplace search to Typesense (dedicated search engine, far superior relevance)
- **Storage:** Migrate from Supabase to Cloudflare R2 (no egress fees become critical at this scale)
- **Monitoring:** Add pg_stat_statements, slow query logging, Datadog or Grafana

---

### 100,000 Users

**Triggers:** Single PostgreSQL instance cannot handle connection count and query volume simultaneously
**Actions:**
- **PgBouncer:** Connection pooling proxy in front of PostgreSQL. Reduce 1000 app connections to 50 DB connections.
- **Table partitioning:**
  - `audit_logs`: partition by month (RANGE on `created_at`) — this table will have 50M+ rows
  - `ai_messages`: partition by month — high volume append-only table
  - `login_history`: partition by month
- **Read replica routing:** Route all GET requests to read replica, all POST/PUT/DELETE to primary
- **Caching tier:** Increase Redis to cluster mode, add L1 in-process cache for categories and frequently read static data
- **AI service:** Scale to multiple FastAPI instances behind a load balancer
- **Background jobs:** Move heavy operations to a job queue (Kafka or SQS): thumbnail generation, PDF vectorization, notification delivery

---

### 1,000,000 Users

**Triggers:** Monolith becomes a bottleneck; specific modules need independent scaling
**Actions:**
- **Extract Marketplace service:** Highest traffic domain, needs independent scaling and its own DB schema
- **Extract AI service:** Already separate (FastAPI) — give it a dedicated vector database (Pinecone or Qdrant)
- **Extract Notification service:** Can be event-driven; move to Kafka consumers
- **PostgreSQL sharding:** User data sharded by `user_id` hash (requires application-level routing)
- **Vector database:** Migrate from FAISS to Pinecone (managed) or Qdrant (self-hosted) — enables cross-document semantic search
- **CDN:** All static assets and thumbnails served from Cloudflare CDN globally
- **Database:** Consider CockroachDB or PlanetScale for global distribution if user base is international
- **Observability:** OpenTelemetry tracing across all services, centralized logging (ELK or Loki)

---

## Section 2: Production Best Practices

### Naming Conventions

```
Tables:         snake_case, plural           → users, marketplace_listings
Columns:        snake_case                   → created_at, user_id, is_active
Primary Keys:   always named "id"            → id UUID
Foreign Keys:   {table_singular}_id         → user_id, listing_id, semester_id
Indexes:        idx_{table}_{columns}        → idx_resources_user_id
Enums:          SCREAMING_SNAKE_CASE values  → 'USER', 'CREATOR', 'ADMIN'
Constraints:    {table}_{column}_check       → ratings_score_check
Sequences:      {table}_{column}_seq         → audit_logs_id_seq
```

### Audit Fields (on every mutable table)

Every table that holds user data or business data must have:
```
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

For entities that require change tracking (resources, listings, profiles):
```
deleted_at  TIMESTAMPTZ  -- Soft delete marker
```

The `updated_at` column is maintained by an application-level trigger or
JPA `@LastModifiedDate` annotation — never trusted from the client.

### Soft Delete Strategy

**What:** Instead of `DELETE FROM resources WHERE id = ?`, set `deleted_at = NOW()`.
**Why:** Preserves referential integrity. Highlights and bookmarks referencing a soft-deleted resource remain valid. Allows undo/restore.
**Implementation:**
- All queries filter by `WHERE deleted_at IS NULL` (enforced by JPA `@Where` annotation or query specification)
- Partial index on `deleted_at IS NULL` for performance
- Hard delete only for: expired tokens, old notifications (>90 days), and explicitly purged audit data after legal retention period

Tables with soft delete: `users`, `semesters`, `subjects`, `resources`, `marketplace_listings`, `reviews`

### Transactions

**Rule:** Any operation that modifies more than one table must be wrapped in a transaction.

Critical transactions:
```
Purchase flow:
  BEGIN
    INSERT payments (status=CREATED)
    [Razorpay webhook confirms]
    UPDATE payments SET status=CAPTURED
    INSERT purchases (status=COMPLETED)
    INSERT resources (source=PURCHASED)  ← buyer gets access
    INSERT creator_earnings
    UPDATE marketplace_listings SET total_sales = total_sales + 1
    UPDATE creator_profiles SET total_sales = total_sales + 1
  COMMIT

Highlight create:
  BEGIN
    INSERT highlights
    UPDATE resources SET highlight_count = highlight_count + 1
  COMMIT

Resource delete (soft):
  BEGIN
    UPDATE resources SET deleted_at = NOW()
    UPDATE subjects SET resource_count = resource_count - 1
  COMMIT
```

### Optimistic Locking

Applied to entities with concurrent update risk:
- `marketplace_listings`: creator edits + admin approval can happen simultaneously
- `resources`: rename while in use

Implementation via JPA `@Version` annotation:
```java
@Version
private Long version;
```
On concurrent update: throws `OptimisticLockException` → caught → user shown "Data was modified. Please refresh."

### Foreign Key Strategy

**All FKs enforced at database level** — application-level validation is not sufficient.

```
ON DELETE CASCADE:    tokens, devices, annotations, bookmarks, highlights
                      (child data meaningless without parent)

ON DELETE RESTRICT:   subjects → resources (cannot delete subject with resources)
                      categories → listings (cannot delete category with listings)

ON DELETE SET NULL:   resources.subject_id (resource survives if subject deleted)
                      annotations.highlight_id (annotation survives if highlight deleted)
```

### Data Integrity Rules

- **Money:** Always stored as INTEGER (paise/cents), never FLOAT or DECIMAL. Use BigDecimal in Java.
- **Emails:** Always stored lowercase. Enforced at application layer and DB constraint.
- **Timestamps:** Always TIMESTAMPTZ (with timezone), never TIMESTAMP. Store in UTC.
- **Booleans:** Never store as CHAR(1) or INT. PostgreSQL has native BOOLEAN.
- **Enums:** Use PostgreSQL native ENUM type or VARCHAR with CHECK constraint. Never use SMALLINT codes.
- **URLs:** Never stored — only storage paths. URL constructed at request time.
- **Passwords:** Never stored — only bcrypt hashes (cost factor 12 minimum).
- **Tokens:** Never stored — only SHA-256 hashes.

### Migration Strategy

Tool: **Flyway** (integrated with Spring Boot)

```
backend/src/main/resources/db/migration/
  V1__create_identity_tables.sql
  V2__create_library_tables.sql
  V3__create_pdf_workspace_tables.sql
  V4__create_ai_tables.sql
  V5__create_marketplace_tables.sql
  V6__create_notification_tables.sql
  V7__create_audit_tables.sql
  V8__add_indexes.sql
  V9__seed_categories.sql
```

**Rules:**
- Migration files are IMMUTABLE once committed — never modify a deployed migration
- Every migration is tested on a local DB before committing
- Schema changes that need rollback require a new forward migration (V10__revert_column.sql)
- Breaking changes require a multi-step deployment: expand → migrate data → contract

### Backup Strategy

**Neon PostgreSQL:** Automated daily backups with 7-day point-in-time recovery (PITR) — included free.
**Manual exports:** Weekly pg_dump to Cloudflare R2 (separate bucket: `backups/`)
**Retention:** 30 days of daily backups, 12 months of monthly exports

### Disaster Recovery

| Scenario | RTO | RPO | Action |
|---|---|---|---|
| Application bug | 5 min | 0 | Rollback deployment. No data change. |
| Bad migration | 30 min | < 1 min | Neon PITR restore to pre-migration timestamp |
| Accidental data deletion | 2 hours | < 1 day | Restore from daily backup to staging, extract data, restore to production |
| Supabase Storage outage | Ongoing | 0 | Signed URLs cached in Redis serve existing users. New uploads queued. Switch to R2 if prolonged. |
| Full DB failure | 4 hours | < 1 day | Restore from pg_dump backup on new Neon instance. Update connection strings. |

---

## Section 3: Database Folder Structure

```
backend/
└── src/
    └── main/
        └── resources/
            └── db/
                ├── migration/              ← Flyway migration files (versioned SQL)
                │   ├── V1__create_identity_tables.sql
                │   ├── V2__create_library_tables.sql
                │   ├── V3__create_pdf_workspace_tables.sql
                │   ├── V4__create_ai_tables.sql
                │   ├── V5__create_marketplace_tables.sql
                │   ├── V6__create_notification_tables.sql
                │   ├── V7__create_audit_tables.sql
                │   ├── V8__add_indexes.sql
                │   └── V9__seed_categories.sql
                └── seed/                   ← Development seed data (not run in production)
                    └── R__dev_seed_data.sql

docs/
└── database/
    ├── 01-domain-model.md          ← Domains, entities, relationships, normalization
    ├── 02-table-design.md          ← Every table, column, constraint, index
    ├── 03-uuid-indexes-storage.md  ← UUID strategy, indexes, file storage, Redis
    ├── 04-er-diagram.md            ← ER diagram in Mermaid
    └── 05-scalability-practices.md ← Scalability plan and best practices
```

**Why Flyway over Liquibase?**
Flyway uses plain SQL — no proprietary DSL to learn. Migrations are readable by any DBA.
Simpler mental model: version number → script → applied once. Perfect for a one-developer project at MVP stage.

**Why separate `seed/` from `migration/`?**
Seed data (`R__` prefix in Flyway = repeatable) is for development only.
Migrations (`V__` prefix = versioned) run in production.
This separation prevents accidentally seeding test data in production.
