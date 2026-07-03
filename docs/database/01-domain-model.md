# Domain Model & Entity Design — AbhiIterates.OS

---

## Section 1: Domain Model

Every domain encapsulates a bounded context.
Each domain owns its data and communicates with others through defined interfaces.
This mirrors the Modular Monolith architecture — each domain maps to a Java package.

---

### Domain 1: Identity & Security

**Responsibility:** Who is the user? Are they authenticated? What can they access?

This domain owns everything about the human behind the keyboard.
It manages the full authentication lifecycle: registration, login, OAuth, token issuance,
refresh token rotation, device tracking, email verification, and password management.

It is the most security-critical domain. Every other domain depends on it for authorization.

**Entities owned:** User, OAuthAccount, RefreshToken, Device, EmailVerification, PasswordReset

---

### Domain 2: Library & Resource Management

**Responsibility:** How does a student organize their academic material?

This domain owns the hierarchical structure of a student's personal knowledge base:
Semesters contain Subjects, Subjects contain Resources, Resources are files in object storage.
The domain also manages organization features: tags, favorites, archives, pins, and recent access.

This domain is the heart of the student experience — everything else orbits it.

**Entities owned:** Semester, Subject, Resource, Tag, ResourceTag, Favorite, RecentAccess, ResourceVersion

---

### Domain 3: PDF Workspace

**Responsibility:** What does the student do with a PDF once it is open?

This domain owns the reading annotations: highlights, bookmarks, page annotations, drawing data,
reading progress, and sticky notes. All are attached to a specific Resource + User combination.

The domain is physically separate from Library because annotations need different
query patterns (by resource, by page, by type) than resource management queries.

**Entities owned:** Bookmark, Highlight, Annotation, ReadingProgress, StickyNote

---

### Domain 4: AI Workspace

**Responsibility:** What did the user ask the AI, and what did it respond?

This domain stores the full history of AI interactions. Each conversation is linked
to exactly one resource (for PDF Q&A) or is standalone (general AI chat).
It stores messages, citations, prompt templates, and usage metrics.

This domain also manages the metadata about what has been vectorized —
but the vectors themselves live in FAISS/vector DB, not PostgreSQL.

**Entities owned:** AiConversation, AiMessage, AiCitation, AiUsage, PromptTemplate

---

### Domain 5: Marketplace

**Responsibility:** How does a creator sell, and how does a student buy?

This domain manages the full commercial lifecycle: listings created by creators,
purchases made by students, payments processed by Razorpay, reviews, ratings,
wishlist, and creator earnings.

This domain has strong financial consistency requirements — purchases and
payments must be transactionally consistent.

**Entities owned:** MarketplaceListing, Category, Purchase, Payment, Review, Rating, Wishlist, CreatorEarning, Coupon

---

### Domain 6: Creator

**Responsibility:** Who is creating content, and what is their profile?

Creators are Users with an elevated role. This domain stores their public profile,
bio, payout information, and aggregate stats. It exists separately from the User entity
to avoid polluting the User table with creator-specific fields.

**Entities owned:** CreatorProfile, PayoutAccount

---

### Domain 7: Collaboration

**Responsibility:** How do students study together?

This domain manages shared study sessions: invitations, participant roles,
shared highlights, collaborative comments, and activity timelines.
This is a Phase 2 domain — designed now, implemented later.

**Entities owned:** StudySession, StudySessionParticipant, SharedHighlight, CollaborationComment, SessionActivity

---

### Domain 8: Notifications

**Responsibility:** How does the platform communicate with users?

This domain manages all in-app and email notifications: the notification record itself,
its delivery status, read status, type, priority, and user preferences.

**Entities owned:** Notification, NotificationPreference

---

### Domain 9: Analytics & Audit

**Responsibility:** What happened, when, and who did it?

This domain exists for two purposes:
1. Product analytics: study sessions, feature usage, read events
2. Security audit: login events, admin actions, sensitive data access

These logs are append-only. Nothing is ever updated or deleted from audit logs.

**Entities owned:** AuditLog, ActivityLog, LoginHistory

---

## Section 2: Entity Identification

Every entity explained with its reason for existence.

---

### IDENTITY DOMAIN

**users**
The central entity. Every other entity either belongs to a user or was created by one.
Stores: identity fields, role, account status, OAuth provider, timestamps.

**oauth_accounts**
Separate from users because one user can have multiple OAuth providers (Google, GitHub in future).
Stores the provider's user ID and token metadata independently from our user identity.
Why not on users table? Because it violates 1NF — you cannot have `google_id, github_id` as columns.

**refresh_tokens**
Database-backed refresh tokens enable true revocation (stateless JWT cannot be revoked).
Each row is one active refresh token. Rotation: old token deleted, new one inserted on every use.
Stores: token hash (never plaintext), user ID, device fingerprint, expiry, used flag.

**devices**
Tracks which devices have authenticated. Enables: "Sign out all other devices" and security alerts
for new device logins. Stores: device fingerprint, IP, user agent, last seen, trusted flag.

**email_verifications**
Temporary tokens for email verification flow. TTL: 24 hours. Deleted after use.

**password_resets**
Temporary tokens for password reset flow. TTL: 1 hour. One-time use. Deleted after use.

---

### LIBRARY DOMAIN

**semesters**
Top-level organizational container. Belongs to one user. Named (e.g., "Semester 5").
Has a year/term field for chronological ordering.

**subjects**
Second-level container. Belongs to one semester. Has a color for visual differentiation.
Examples: "DBMS", "Operating Systems", "Computer Networks".

**resources**
A file asset uploaded by the user or purchased from the marketplace.
Critical distinction: a resource record in PostgreSQL stores METADATA about the file.
The actual bytes live in object storage (Supabase/R2).
Stores: title, subject_id (owner location), storage_path, file_size, page_count, mime_type,
source (UPLOADED vs PURCHASED), original_listing_id (if purchased).

**tags**
User-defined labels. Global per user (not per resource) to avoid duplication.
Example: "exam important", "chapter 4", "revision".

**resource_tags**
Junction table: Resource ↔ Tag (Many-to-Many).

**favorites**
Junction table: User ↔ Resource. Marks a resource as favorited for quick access.
Not a boolean on resources table because that would require a join anyway.

**recent_access**
Tracks the last-accessed timestamp for each user-resource combination.
Enables "Recently Opened" on dashboard without querying read events.
Upserted on every open: if exists → update timestamp; if not → insert.

---

### PDF WORKSPACE DOMAIN

**bookmarks**
A saved page reference inside a specific resource.
Belongs to: user + resource + page number.
Optional: label text (user can name bookmarks).
One user can bookmark the same page multiple times (for different labels).

**highlights**
A text selection on a specific page with a color.
Stores: user_id, resource_id, page_number, start_offset, end_offset, selected_text, color.
Text offsets are PDF.js text layer position data — enables exact reproduction across sessions.

**annotations**
A text note attached to a page or to a specific highlight.
Separate from highlights because: (a) not all annotations have highlights, (b) annotations
have their own display logic (sticky note marker in margin).

**reading_progress**
One row per user-resource pair. Stores: last_page_number, total_pages, percent_complete.
Upserted every N pages or on session end.

---

### AI DOMAIN

**ai_conversations**
One conversation = one AI session on one resource (or standalone).
Stores: user_id, resource_id (nullable for standalone), title (auto-generated), model used, token count.

**ai_messages**
Individual messages in a conversation. Stores: role (USER | ASSISTANT),
content (full text), created_at. Ordered by created_at for reconstruction.

**ai_citations**
Page references cited in an AI response. Child of ai_messages.
Stores: message_id, resource_id, page_number, excerpt (text from that page used as context).
Enables clickable citations in the UI.

**ai_usage**
Daily usage tracking per user for rate limiting.
Stores: user_id, date, message_count, token_count.
Checked before every AI request. Incremented after.

**prompt_templates**
Pre-defined prompt templates (suggested prompts shown in AI panel).
Admin-managed. Can be global or category-specific.

---

### MARKETPLACE DOMAIN

**marketplace_listings**
A resource listed for sale by a creator.
NOT the same as a library resource. This is the commercial listing:
stores title, description, price, category, preview_pages_count, status (DRAFT/PENDING/ACTIVE/REJECTED),
storage_path (the file for sale — separate from buyer copies).
Linked to creator (user_id). Has its own file in storage.

**categories**
Hierarchical subject categories: Engineering > Computer Science > DBMS.
Stores: name, slug, parent_id (self-referencing for hierarchy), icon.

**purchases**
Records a student buying a marketplace listing.
Stores: buyer_id, listing_id, payment_id, purchase_price, status.
On successful purchase: a Resource record is created in the buyer's library.

**payments**
Financial record of a Razorpay transaction.
Stores: razorpay_order_id, razorpay_payment_id, amount, currency, status, gateway_response.
One-to-one with Purchase. Kept separately for financial audit compliance.

**reviews**
Text review of a purchased listing. Only purchasers can review.
Stores: buyer_id, listing_id, content, created_at, is_visible.

**ratings**
Numeric rating (1-5) of a purchased listing.
Separate from reviews because: some users rate without reviewing.
The average rating is cached on marketplace_listings to avoid expensive aggregation on every page load.

**wishlists**
Junction table: User ↔ MarketplaceListing. Simple save-for-later.

**coupons**
Discount codes. Stores: code, discount_type (PERCENT | FIXED), value,
max_uses, used_count, valid_from, valid_until, created_by (admin).

**creator_earnings**
Ledger of creator payouts. Immutable once settled.
Stores: creator_id, purchase_id, gross_amount, platform_fee, net_amount, status (PENDING | SETTLED).

---

### CREATOR DOMAIN

**creator_profiles**
Extended profile for users with CREATOR role.
One-to-one with users. Stores: bio, website, display_name, payout_upi_id,
total_earnings, total_sales. Exists separately to avoid polluting the users table.

---

### COLLABORATION DOMAIN (Phase 2)

**study_sessions**
A collaborative reading session on a shared resource.
Stores: host_user_id, resource_id, session_code (join code), status, started_at, ended_at.

**study_session_participants**
Junction table: StudySession ↔ User. Stores: role (HOST | VIEWER | EDITOR), joined_at.

**collaboration_comments**
Thread comments on a specific page of a shared resource.
Stores: session_id, user_id, page_number, content, parent_id (for replies), created_at.

**shared_highlights**
Highlights made visible to the study group.
Stores: highlight_id, session_id (shared to this session).

---

### NOTIFICATIONS DOMAIN

**notifications**
One row per notification. Stores: recipient_id, type, title, body,
entity_type (PURCHASE | LISTING | etc.), entity_id, is_read, created_at.

**notification_preferences**
One row per user. Stores boolean flags for each notification type.
Email and in-app controlled separately.

---

### AUDIT DOMAIN

**audit_logs**
Append-only. Every significant action recorded: WHO, WHAT, WHEN, FROM WHERE.
Stores: user_id, action, entity_type, entity_id, old_value (JSON), new_value (JSON), ip_address.

**login_history**
Every login event: success or failure.
Stores: user_id (nullable on failure), email_attempted, success, ip_address, device_id, created_at.

---

## Section 3: Entity Relationships

### One-to-One Relationships

| Entity A | Entity B | Rule |
|---|---|---|
| User | CreatorProfile | A creator has exactly one profile. A profile belongs to exactly one user. Profile created on creator upgrade, not on registration. |
| Purchase | Payment | Every purchase has exactly one payment record. Payment created before purchase is confirmed. |

### One-to-Many Relationships

| Parent | Child | Cascade Rule |
|---|---|---|
| User | Semester | User deleted → semesters deleted (SOFT DELETE only) |
| User | RefreshToken | User deleted → all tokens invalidated |
| User | Device | User logs out all → all devices removed |
| User | Bookmark | User deleted → bookmarks deleted |
| User | Highlight | User deleted → highlights deleted |
| User | AiConversation | User deleted → conversations deleted |
| Semester | Subject | Semester deleted → subjects deleted |
| Subject | Resource | Subject deleted → resources NOT deleted (user may want to move them first) |
| Resource | Bookmark | Resource deleted → bookmarks deleted |
| Resource | Highlight | Resource deleted → highlights deleted |
| Resource | Annotation | Resource deleted → annotations deleted |
| Resource | ReadingProgress | Resource deleted → progress deleted |
| AiConversation | AiMessage | Conversation deleted → messages deleted |
| AiMessage | AiCitation | Message deleted → citations deleted |
| MarketplaceListing | Review | Listing deleted → reviews soft-deleted (preserved for audit) |
| MarketplaceListing | Rating | Listing deleted → ratings soft-deleted |
| User | Purchase | User deleted → purchases anonymized (financial records kept) |
| User | Notification | User deleted → notifications deleted |
| Category | MarketplaceListing | Category deleted → listings moved to "Uncategorized" (DO NOT cascade delete) |
| Category | Category | Parent category deleted → child categories become root-level |

### Many-to-Many Relationships (resolved via junction tables)

| Entity A | Entity B | Junction Table | Extra Fields |
|---|---|---|---|
| Resource | Tag | resource_tags | created_at |
| User | Resource | favorites | created_at |
| User | MarketplaceListing | wishlists | created_at |
| StudySession | User | study_session_participants | role, joined_at |
| Highlight | StudySession | shared_highlights | shared_at, shared_by |

### Self-Referencing Relationships

| Entity | Self-Reference | Purpose |
|---|---|---|
| Category | parent_id → id | Hierarchical category tree (max 3 levels) |
| CollaborationComment | parent_id → id | Threaded replies |

### Deletion Rules (Critical Decisions)

**NEVER hard delete:**
- users (anonymize instead: null out PII, keep the shell for referential integrity)
- purchases (financial records — legal requirement)
- payments (financial records — legal requirement)
- audit_logs (immutable by design)
- creator_earnings (financial records)

**Soft delete (set deleted_at timestamp):**
- semesters, subjects, resources, marketplace_listings, reviews

**Hard delete (safe to remove completely):**
- refresh_tokens (on logout or rotation)
- email_verifications (on use or expiry)
- password_resets (on use or expiry)
- notifications (after 90 days)

---

## Section 4: Database Normalization

### First Normal Form (1NF)
**Rule:** Every column contains atomic values. No repeating groups.

Violations we explicitly prevent:
- ❌ `tags VARCHAR` storing comma-separated tags → replaced with `resource_tags` junction table
- ❌ `google_id, github_id` columns on users → replaced with `oauth_accounts` table
- ❌ `page_bookmarks INT[]` array on resources → replaced with `bookmarks` table
- ❌ `colors JSONB` storing multiple highlight colors on one row → separate `highlights` rows

Every column in every table holds exactly one value of one type.

### Second Normal Form (2NF)
**Rule:** Every non-key attribute is fully dependent on the entire primary key (not a subset).

Applied to junction tables:
- `resource_tags(resource_id, tag_id, created_at)` — `created_at` depends on the full composite key ✅
- `favorites(user_id, resource_id, created_at)` — `created_at` depends on the full composite key ✅

### Third Normal Form (3NF)
**Rule:** No transitive dependencies — non-key attributes do not depend on other non-key attributes.

Examples enforced:
- `marketplace_listings` does NOT store `creator_name` (depends on creator, not listing) → JOIN to users
- `purchases` does NOT store `listing_title` (depends on listing, not purchase) → JOIN to listings
- `highlights` does NOT store `resource_title` (depends on resource, not highlight) → JOIN to resources
- `creator_earnings` stores `platform_fee` as its own column (not derived from gross_amount + rate) because rates may change

### BCNF (Boyce-Codd Normal Form)
Applied where composite keys could create anomalies:
- `study_session_participants(session_id, user_id, role, joined_at)` — composite PK (session_id, user_id). `role` depends only on the composite key. ✅

### Where We Intentionally Denormalize (and Why)

| Denormalization | Location | Reason |
|---|---|---|
| `avg_rating DECIMAL` | marketplace_listings | Aggregating rating on every product page view is a full table scan on reviews. Cache the average, update on every new rating. |
| `total_sales INT` | marketplace_listings | Same — count(*) on purchases is expensive at scale. |
| `total_earnings DECIMAL` | creator_profiles | Pre-aggregated for creator dashboard. Updated via DB trigger or application on each settled earning. |
| `message_count INT` | ai_usage | Rate limiting requires an instant count check — no time for COUNT(*). |
| `highlight_count INT` | resources | Shown on resource cards — pre-aggregated to avoid per-card JOIN. |
| `bookmark_count INT` | resources | Same. |

**Rule:** We denormalize ONLY for read-performance on frequently accessed aggregate values.
We ALWAYS maintain consistency: the cached column is updated transactionally with the source data change.
