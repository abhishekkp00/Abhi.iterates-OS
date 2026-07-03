# UUID Strategy, Indexing & Storage Architecture — AbhiIterates.OS

---

## Section 1: UUID Strategy

### Tables Using UUID Primary Keys

| Table | Reason |
|---|---|
| `users` | User IDs appear in URLs, tokens, and API responses. Sequential IDs expose user count and are trivially enumerable (`/users/1`, `/users/2`). UUID prevents enumeration attacks. |
| `resources` | Resource IDs appear in signed URLs and API paths. Non-sequential prevents scraping all resources. |
| `marketplace_listings` | Listing IDs in public URLs — UUID prevents competitors from enumerating total listings. |
| `purchases` | Purchase IDs in receipts and API responses — UUID prevents guessing other users' purchase records. |
| `payments` | Financial records — UUID prevents enumeration of total transactions. |
| `refresh_tokens` | Security tokens — must be non-enumerable. |
| `highlights` | No enumeration risk but UUID maintains consistency across all user-owned entities. |
| `bookmarks` | Same as highlights. |
| `ai_conversations` | Conversation IDs in URLs — UUID prevents enumerating other users' chat history. |
| `ai_messages` | Child of conversations — UUID for consistency. |
| `semesters` | IDs appear in nested routes `/library/:semId` — UUID prevents guessing other users' semesters. |
| `subjects` | Same as semesters. |
| `devices` | Device IDs are security identifiers — must be non-enumerable. |
| `notifications` | UUID for consistency. |
| `creator_earnings` | Financial records — UUID. |

### Tables Using Sequential (SERIAL / BIGSERIAL) Primary Keys

| Table | Reason |
|---|---|
| `categories` | Categories are public, admin-managed, and never exposed in security-sensitive contexts. Sequential is fine — Kubernetes style: category/engineering/3. |
| `audit_logs` | Extremely high volume. UUID would waste 16 bytes vs 8 bytes per row × millions of rows. These IDs are never exposed externally. Sequential ordering is also useful for log processing. |
| `login_history` | Same as audit_logs — high volume, never exposed externally. |

### UUID Generation
- PostgreSQL: `gen_random_uuid()` (available in PostgreSQL 13+ without extensions)
- Java: `UUID.randomUUID()` generated in application, not delegated to DB
- Format: Standard UUID v4, stored as native `UUID` type (not VARCHAR) — 16 bytes, indexed efficiently

---

## Section 2: Indexing Strategy

### Why Every Index Listed Below Exists

**Rule:** Index = faster reads, slower writes, more disk space.
Create an index only when: (a) the column is used in WHERE/ORDER BY/JOIN on a hot path,
and (b) the table will have more than ~10,000 rows. Never pre-index prematurely.

---

### Identity Domain Indexes

```
users:
  idx_users_email             UNIQUE  -- Login lookup (hot path, every request)
  idx_users_role              BTREE   -- Admin user listing, role-based queries
  idx_users_deleted_at        BTREE   -- Soft-delete filter (partial: WHERE deleted_at IS NOT NULL)

oauth_accounts:
  idx_oauth_provider_uid      UNIQUE(provider, provider_user_id) -- OAuth login lookup

refresh_tokens:
  idx_rtoken_token_hash       UNIQUE  -- Every authenticated request validates token
  idx_rtoken_user_id          BTREE   -- "Revoke all my sessions" query
  idx_rtoken_family_id        BTREE   -- Theft detection: revoke entire family
  idx_rtoken_expires_at       BTREE   -- Cron job cleanup of expired tokens

devices:
  idx_devices_user_id         BTREE   -- List user's devices
  idx_devices_fingerprint     UNIQUE(user_id, fingerprint) -- Prevent duplicate device records
```

---

### Library Domain Indexes

```
semesters:
  idx_semesters_user_id       BTREE   -- "Get all my semesters" (every library page load)
  idx_semesters_user_active   BTREE(user_id, deleted_at) -- Filtered: active semesters only

subjects:
  idx_subjects_semester_id    BTREE   -- "Get all subjects in this semester"
  idx_subjects_user_id        BTREE   -- Cross-semester user queries

resources:
  idx_resources_user_id       BTREE   -- "All my resources" search
  idx_resources_subject_id    BTREE   -- "All resources in this subject"
  idx_resources_user_archived BTREE(user_id, is_archived) -- Active vs archived filter
  idx_resources_source        BTREE(user_id, source)      -- Purchased vs uploaded filter
  idx_resources_title_fts     GIN(to_tsvector('english', title)) -- Full-text search on titles

recent_access:
  idx_recent_user_time        BTREE(user_id, accessed_at DESC) -- "Recently opened" (dashboard)
```

---

### PDF Workspace Indexes

```
bookmarks:
  idx_bookmarks_user_resource BTREE(user_id, resource_id) -- All bookmarks for a PDF
  idx_bookmarks_resource_id   BTREE   -- Bookmark count queries

highlights:
  idx_highlights_user_resource BTREE(user_id, resource_id) -- All highlights for a PDF
  idx_highlights_resource_page BTREE(resource_id, page_number) -- Highlights per page
  idx_highlights_user_id      BTREE   -- All highlights across all resources

reading_progress:
  idx_rp_user_time            BTREE(user_id, last_read_at DESC) -- "Continue Reading" widget
```

---

### AI Domain Indexes

```
ai_conversations:
  idx_aicon_user_id           BTREE   -- User's conversation list
  idx_aicon_user_resource     BTREE(user_id, resource_id) -- Conversations for a resource
  idx_aicon_user_updated      BTREE(user_id, updated_at DESC) -- Recent conversations first
  idx_aicon_user_pinned       BTREE(user_id, is_pinned)    -- Pinned conversations

ai_messages:
  idx_aimsg_conversation_time BTREE(conversation_id, created_at ASC) -- Message ordering

ai_usage:
  idx_aiusage_user_date       UNIQUE(user_id, usage_date)  -- Daily rate limit check (hot path)
```

---

### Marketplace Indexes

```
marketplace_listings:
  idx_ml_creator_id           BTREE   -- "My listings" on creator dashboard
  idx_ml_category_id          BTREE   -- Browse by category
  idx_ml_status               BTREE   -- Active listings filter
  idx_ml_status_rating        BTREE(status, avg_rating DESC)    -- Sort by rating
  idx_ml_status_sales         BTREE(status, total_sales DESC)   -- Sort by popularity
  idx_ml_status_created       BTREE(status, created_at DESC)    -- Sort by newest
  idx_ml_title_fts            GIN(to_tsvector('english', title || ' ' || description))
  idx_ml_price                BTREE(status, price_paise)        -- Price filter/sort

purchases:
  idx_purchases_buyer_id      BTREE   -- "My purchases" history
  idx_purchases_listing_id    BTREE   -- Sales per listing (creator analytics)
  idx_purchases_buyer_listing UNIQUE(buyer_id, listing_id) -- Prevent duplicate purchase

ratings:
  idx_ratings_listing_id      BTREE   -- Compute average rating per listing

creator_earnings:
  idx_earnings_creator_id     BTREE   -- Creator earnings overview
  idx_earnings_status         BTREE(creator_id, status) -- Pending vs settled
```

---

### Audit Indexes

```
audit_logs:
  idx_audit_user_id           BTREE   -- User activity lookup
  idx_audit_action            BTREE   -- Filter by action type
  idx_audit_entity            BTREE(entity_type, entity_id) -- "History of this resource"
  idx_audit_created_at        BTREE   -- Time-range queries

login_history:
  idx_login_user_id           BTREE   -- User's login history
  idx_login_ip_time           BTREE(ip_address, created_at) -- Brute force detection
```

---

### Full-Text Search Indexes (PostgreSQL native FTS)

```sql
-- Resources: search by title (owner's own library)
CREATE INDEX idx_resources_title_fts
  ON resources USING GIN (to_tsvector('english', title));

-- Marketplace: search by title and description
CREATE INDEX idx_ml_fts
  ON marketplace_listings USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  );
```

For Phase 2, consider migrating marketplace search to Elasticsearch or Typesense
when listings exceed 100,000 rows and search relevance requirements increase.

---

## Section 3: File Storage Architecture

### What Lives Where

| Data Type | Storage Location | Reason |
|---|---|---|
| User avatars | Supabase Storage | Small files, served publicly via CDN |
| Uploaded PDFs (personal) | Supabase Storage (private bucket) | Must be private, requires signed URL |
| Marketplace listing files | Supabase Storage (private bucket) | DRM — only accessible post-purchase |
| Resource thumbnails | Supabase Storage (public bucket) | Cached, served via CDN, not sensitive |
| Listing preview thumbnails | Supabase Storage (public bucket) | Public product images |
| AI vector embeddings | FAISS index (file on server) | Binary format, not suitable for SQL |
| JWT tokens | Never stored (stateless) | — |
| Refresh tokens | PostgreSQL (hash only) | Needs revocation, fast lookup |
| Session data | Redis | Transient, TTL-managed |

### Bucket Structure

```
supabase-storage/
├── avatars/                     ← PUBLIC bucket
│   └── {userId}/avatar.webp
│
├── thumbnails/                  ← PUBLIC bucket
│   ├── resources/{resourceId}/thumb.webp
│   └── listings/{listingId}/thumb.webp
│
├── resources/                   ← PRIVATE bucket
│   └── {userId}/{resourceId}/{filename}.pdf
│
└── listings/                    ← PRIVATE bucket (most restricted)
    └── {creatorId}/{listingId}/{filename}.pdf
```

### File Naming Convention

```
Pattern:  {userId}/{entityId}/{sanitized-title}-{timestamp}.pdf
Example:  usr_abc123/res_xyz789/dbms-unit-4-2024-01-15T143022Z.pdf

Rules:
- Strip special characters from filename (XSS prevention)
- Lowercase, hyphens only
- Append timestamp to prevent collisions on rename/re-upload
- Never use the original uploaded filename as the storage key
```

### Signed URL Strategy

```
Private bucket access uses time-limited signed URLs.

Personal resources:
  TTL: 30 minutes (user is actively reading)
  Generated: on PDF open request
  Served via: GET /api/v1/resources/{id}/access-url

Marketplace listings (purchased):
  TTL: 30 minutes
  Check: purchase record must exist and be COMPLETED
  Served via: GET /api/v1/purchases/{id}/access-url

Marketplace listing previews (not purchased):
  TTL: 10 minutes (browse session)
  Pages: first N pages only (enforced via separate preview file)
  Served via: GET /api/v1/marketplace/{id}/preview-url

What signed URLs prevent:
  ✅ Sharing the direct URL gives only 30-minute access
  ✅ Unauthorized direct bucket access is impossible
  ❌ Cannot prevent screen recording or screenshots (browser limitation — accepted)
```

### Metadata Stored in PostgreSQL

Every file in object storage has a corresponding PostgreSQL record containing:
- `storage_path` — the exact path inside the bucket (never the full URL)
- `file_size_bytes` — for display and storage quota enforcement
- `mime_type` — validated server-side before storage
- `page_count` — extracted by server-side PDF processing
- `thumbnail_path` — path to generated thumbnail

The full URL is **never stored** in PostgreSQL. It is constructed at request time:
```
signed_url = supabase_client.storage.from('resources').create_signed_url(storage_path, ttl=1800)
```

This means changing the storage provider only requires updating the URL generation logic —
not migrating PostgreSQL data.

---

## Section 4: Redis Usage Plan

### What Redis Stores

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `session:{userId}` | User session data (role, plan) | 15 min | Avoid DB lookup on every request |
| `ratelimit:auth:{ip}` | Request count | 15 min | Auth endpoint rate limiting (login, register) |
| `ratelimit:ai:{userId}` | AI request count | 1 hour | AI usage rate limiting |
| `ratelimit:upload:{userId}` | Upload count | 1 hour | Upload rate limiting |
| `listing:view:{listingId}` | View increment queue | Flush every 60s | Batched view count update (avoid DB write per page view) |
| `dashboard:{userId}` | Serialized dashboard data | 60 sec | Dashboard widget cache |
| `categories:all` | Category tree JSON | 1 hour | Avoid category table scan on every marketplace load |
| `listing:featured` | Featured listings array | 30 min | Admin-curated featured section |

### What Redis Does NOT Store

- Refresh tokens (need persistent storage for revocation)
- Highlights or bookmarks (must survive Redis flush)
- User profile data (authoritative data stays in PostgreSQL)
- Payment data (never in cache — audit requirement)

### Cache Invalidation Strategy

**Cache-aside pattern:**
1. Application checks Redis first
2. On cache miss: query PostgreSQL, populate Redis with TTL
3. On data write: explicitly delete the cache key (not update)

```
dashboard:{userId} invalidated when:
  - Resource uploaded or deleted
  - Bookmark added or removed
  - Reading progress updated

categories:all invalidated when:
  - Admin creates, updates, or deletes a category
```
