# Database Design — AbhiIterates.OS

> **Day 3 Complete.** This file is an index to the full database documentation.

---

## Documents

| File | Contents |
|---|---|
| [01-domain-model.md](database/01-domain-model.md) | 9 domains, 45+ entities, all relationships, normalization (1NF–BCNF) |
| [02-table-design.md](database/02-table-design.md) | Every table with columns, types, constraints, and indexes |
| [03-uuid-indexes-storage.md](database/03-uuid-indexes-storage.md) | UUID strategy, 40+ indexes, file storage architecture, Redis plan |
| [04-er-diagram.md](database/04-er-diagram.md) | Full ER diagram in Mermaid syntax |
| [05-scalability-practices.md](database/05-scalability-practices.md) | Scalability from 100 → 1M users, best practices, migration strategy |

---

## Quick Reference

### Technology Decisions
- **Primary DB:** PostgreSQL 16 on Neon (serverless, auto-scaling)
- **Cache:** Redis on Upstash (serverless, HTTP-based)
- **File Storage:** Supabase Storage MVP → Cloudflare R2 production
- **Vector Store:** FAISS (development) → Pinecone/Qdrant (production)
- **Migrations:** Flyway (plain SQL, version-controlled)

### Table Count: 30 tables across 9 domains

### Key Design Decisions
1. Money stored as INTEGER (paise) — never FLOAT
2. Timestamps as TIMESTAMPTZ (UTC) — never TIMESTAMP
3. UUID PKs on all user-facing entities — prevents enumeration attacks
4. BIGSERIAL PKs on audit/log tables — high volume, never exposed
5. Soft delete on all user data — preserves referential integrity
6. Signed URLs for all private files — 30-minute TTL
7. Denormalized counters (highlight_count, total_sales) — updated transactionally
8. Full-text search via PostgreSQL GIN indexes (MVP) → Typesense (at scale)
