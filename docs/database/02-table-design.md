# Table Design — AbhiIterates.OS

Every table, every column, every constraint. No SQL yet — only design.
Convention: snake_case, plural table names, UUID PKs where security matters.

---

## IDENTITY DOMAIN

### Table: `users`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK, default gen_random_uuid() |
| email | VARCHAR(255) | NO | UNIQUE |
| name | VARCHAR(100) | NO | |
| password_hash | VARCHAR(255) | YES | NULL if OAuth-only user |
| role | ENUM('USER','CREATOR','ADMIN') | NO | DEFAULT 'USER' |
| avatar_url | VARCHAR(500) | YES | Points to storage path |
| is_active | BOOLEAN | NO | DEFAULT true |
| is_email_verified | BOOLEAN | NO | DEFAULT false |
| college_name | VARCHAR(200) | YES | |
| discipline | VARCHAR(100) | YES | Engineering, Medical, etc. |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | YES | Soft delete |
| last_login_at | TIMESTAMPTZ | YES | |

**Indexes:** `email` (UNIQUE), `role`, `deleted_at`
**Constraints:** `email` format check, `role` ENUM
**Soft delete:** `deleted_at IS NOT NULL` means deactivated

---

### Table: `oauth_accounts`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| provider | ENUM('GOOGLE','GITHUB') | NO | |
| provider_user_id | VARCHAR(255) | NO | Google's sub claim |
| email | VARCHAR(255) | NO | Email from provider |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Constraints:** UNIQUE(provider, provider_user_id)
**Indexes:** `user_id`, `(provider, provider_user_id)` UNIQUE

---

### Table: `refresh_tokens`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| token_hash | VARCHAR(255) | NO | SHA-256 of the actual token |
| device_id | UUID | YES | FK → devices.id |
| family_id | UUID | NO | Token family for theft detection |
| is_revoked | BOOLEAN | NO | DEFAULT false |
| expires_at | TIMESTAMPTZ | NO | NOW() + 30 days |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| used_at | TIMESTAMPTZ | YES | Set when token is consumed |

**Indexes:** `token_hash` (UNIQUE), `user_id`, `family_id`, `expires_at`
**Note:** On refresh, old token `is_revoked = true`, new token inserted. If a revoked token is presented, entire family is revoked (theft detection).

---

### Table: `devices`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| fingerprint | VARCHAR(255) | NO | Hashed device identifier |
| user_agent | TEXT | YES | Browser/OS string |
| ip_address | INET | YES | Last known IP |
| is_trusted | BOOLEAN | NO | DEFAULT false |
| last_seen_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `user_id`, `fingerprint`, UNIQUE(`user_id`, `fingerprint`)

---

### Table: `email_verifications`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| token_hash | VARCHAR(255) | NO | UNIQUE |
| expires_at | TIMESTAMPTZ | NO | NOW() + 24h |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

---

### Table: `password_resets`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| token_hash | VARCHAR(255) | NO | UNIQUE |
| expires_at | TIMESTAMPTZ | NO | NOW() + 1h |
| is_used | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

---

## LIBRARY DOMAIN

### Table: `semesters`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| name | VARCHAR(100) | NO | "Semester 5" |
| term | VARCHAR(50) | YES | "Fall 2024" |
| start_year | SMALLINT | YES | |
| display_order | SMALLINT | NO | DEFAULT 0, for manual ordering |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | YES | Soft delete |

**Indexes:** `user_id`, `(user_id, deleted_at)`

---

### Table: `subjects`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| semester_id | UUID | NO | FK → semesters.id ON DELETE CASCADE |
| user_id | UUID | NO | FK → users.id (denorm for fast query) |
| name | VARCHAR(100) | NO | "DBMS" |
| color | VARCHAR(7) | NO | DEFAULT '#6366f1' (hex) |
| icon | VARCHAR(50) | YES | Icon name from Lucide |
| display_order | SMALLINT | NO | DEFAULT 0 |
| resource_count | INT | NO | DEFAULT 0 (denorm, updated on insert/delete) |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | YES | Soft delete |

**Indexes:** `semester_id`, `user_id`, `(semester_id, deleted_at)`

---

### Table: `resources`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| subject_id | UUID | YES | FK → subjects.id (nullable if orphaned from move) |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| title | VARCHAR(255) | NO | |
| description | TEXT | YES | |
| file_name | VARCHAR(255) | NO | Original filename |
| storage_path | VARCHAR(500) | NO | Path inside Supabase/R2 bucket |
| file_size_bytes | BIGINT | NO | |
| mime_type | VARCHAR(100) | NO | DEFAULT 'application/pdf' |
| page_count | INT | YES | Populated after server-side processing |
| thumbnail_path | VARCHAR(500) | YES | First page thumbnail |
| source | ENUM('UPLOADED','PURCHASED') | NO | DEFAULT 'UPLOADED' |
| original_listing_id | UUID | YES | FK → marketplace_listings.id if PURCHASED |
| highlight_count | INT | NO | DEFAULT 0 (denorm) |
| bookmark_count | INT | NO | DEFAULT 0 (denorm) |
| is_vectorized | BOOLEAN | NO | DEFAULT false |
| is_favorite | BOOLEAN | NO | DEFAULT false (per-user, denorm shortcut) |
| is_archived | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | YES | Soft delete |

**Indexes:** `user_id`, `subject_id`, `(user_id, is_archived)`, `(user_id, source)`, `deleted_at`
**Note:** `is_favorite` is a per-user flag stored here for simplicity at MVP. Phase 2: move to `favorites` junction table.

---

### Table: `tags`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| name | VARCHAR(50) | NO | |
| color | VARCHAR(7) | YES | Optional color per tag |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Constraints:** UNIQUE(`user_id`, `name`) — no duplicate tags per user

---

### Table: `resource_tags`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| tag_id | UUID | NO | FK → tags.id ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**PK:** Composite (resource_id, tag_id)

---

### Table: `recent_access`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| accessed_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**PK:** Composite (user_id, resource_id)
**Note:** UPSERT on every open — if row exists, update `accessed_at`. If not, insert.
**Index:** `(user_id, accessed_at DESC)` — for "Recently Opened" query

---

## PDF WORKSPACE DOMAIN

### Table: `bookmarks`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| page_number | INT | NO | 1-indexed |
| label | VARCHAR(200) | YES | Optional bookmark name |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `(user_id, resource_id)`, `resource_id`

---

### Table: `highlights`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| page_number | INT | NO | |
| selected_text | TEXT | NO | The highlighted text content |
| color | ENUM('YELLOW','GREEN','BLUE','PINK') | NO | DEFAULT 'YELLOW' |
| position_data | JSONB | NO | PDF.js text layer position: {start, end, rects} |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `(user_id, resource_id)`, `(resource_id, page_number)`, `user_id`
**Note:** `position_data` stored as JSONB because PDF.js position format may evolve.

---

### Table: `annotations`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| highlight_id | UUID | YES | FK → highlights.id (nullable: annotation can exist without highlight) |
| page_number | INT | NO | |
| content | TEXT | NO | The note text |
| position_x | DECIMAL(8,4) | YES | Percentage-based X position on page |
| position_y | DECIMAL(8,4) | YES | Percentage-based Y position on page |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `(user_id, resource_id)`, `highlight_id`

---

### Table: `reading_progress`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id ON DELETE CASCADE |
| current_page | INT | NO | DEFAULT 1 |
| total_pages | INT | YES | |
| percent_complete | DECIMAL(5,2) | NO | DEFAULT 0.00 |
| last_read_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**PK:** Composite (user_id, resource_id)
**Index:** `(user_id, last_read_at DESC)` — for "Continue Reading" widget

---

## AI DOMAIN

### Table: `ai_conversations`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| resource_id | UUID | YES | FK → resources.id (NULL = standalone) |
| title | VARCHAR(255) | YES | Auto-generated from first message |
| model_used | VARCHAR(100) | NO | e.g., 'gemini-1.5-flash' |
| message_count | INT | NO | DEFAULT 0 (denorm) |
| total_tokens | INT | NO | DEFAULT 0 |
| is_pinned | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `user_id`, `(user_id, resource_id)`, `(user_id, is_pinned)`, `(user_id, updated_at DESC)`

---

### Table: `ai_messages`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| conversation_id | UUID | NO | FK → ai_conversations.id ON DELETE CASCADE |
| role | ENUM('USER','ASSISTANT') | NO | |
| content | TEXT | NO | Full message text |
| token_count | INT | YES | Token count for this message |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `(conversation_id, created_at ASC)` — for ordered message retrieval

---

### Table: `ai_citations`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| message_id | UUID | NO | FK → ai_messages.id ON DELETE CASCADE |
| resource_id | UUID | NO | FK → resources.id |
| page_number | INT | NO | |
| excerpt | TEXT | YES | Context chunk used from that page |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Index:** `message_id`

---

### Table: `ai_usage`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| usage_date | DATE | NO | DEFAULT CURRENT_DATE |
| message_count | INT | NO | DEFAULT 0 |
| token_count | INT | NO | DEFAULT 0 |

**PK:** Composite (user_id, usage_date)
**Index:** `(user_id, usage_date)` — rate limiting check

---

## MARKETPLACE DOMAIN

### Table: `categories`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | SERIAL | NO | PK (sequential is fine — not security sensitive) |
| name | VARCHAR(100) | NO | |
| slug | VARCHAR(100) | NO | UNIQUE, URL-friendly |
| parent_id | INT | YES | FK → categories.id (self-referencing) |
| icon | VARCHAR(50) | YES | Lucide icon name |
| display_order | SMALLINT | NO | DEFAULT 0 |
| is_active | BOOLEAN | NO | DEFAULT true |

**Indexes:** `slug` (UNIQUE), `parent_id`

---

### Table: `marketplace_listings`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| creator_id | UUID | NO | FK → users.id |
| category_id | INT | NO | FK → categories.id |
| title | VARCHAR(255) | NO | |
| description | TEXT | NO | Rich text |
| storage_path | VARCHAR(500) | NO | Master file in private bucket |
| preview_pages | SMALLINT | NO | DEFAULT 10 |
| thumbnail_path | VARCHAR(500) | YES | |
| page_count | INT | YES | |
| file_size_bytes | BIGINT | YES | |
| price_paise | INT | NO | Price in paise (₹299 = 29900 paise) |
| status | ENUM('DRAFT','PENDING','ACTIVE','REJECTED','ARCHIVED') | NO | DEFAULT 'DRAFT' |
| rejection_reason | TEXT | YES | Populated when REJECTED |
| avg_rating | DECIMAL(3,2) | NO | DEFAULT 0.00 (denorm) |
| total_ratings | INT | NO | DEFAULT 0 (denorm) |
| total_sales | INT | NO | DEFAULT 0 (denorm) |
| total_views | INT | NO | DEFAULT 0 (denorm) |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | YES | Soft delete |

**Indexes:** `creator_id`, `category_id`, `status`, `(status, avg_rating DESC)`, `(status, total_sales DESC)`, `(status, created_at DESC)`, `deleted_at`
**Note:** `price_paise` stores price in smallest currency unit. Never store money as FLOAT.

---

### Table: `purchases`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| buyer_id | UUID | NO | FK → users.id |
| listing_id | UUID | NO | FK → marketplace_listings.id |
| payment_id | UUID | NO | FK → payments.id |
| purchase_price_paise | INT | NO | Price at time of purchase (immutable) |
| status | ENUM('PENDING','COMPLETED','REFUNDED') | NO | DEFAULT 'PENDING' |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| completed_at | TIMESTAMPTZ | YES | |

**Constraints:** UNIQUE(buyer_id, listing_id) — prevent duplicate purchases
**Indexes:** `buyer_id`, `listing_id`, `payment_id`, `status`

---

### Table: `payments`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| razorpay_order_id | VARCHAR(255) | NO | UNIQUE |
| razorpay_payment_id | VARCHAR(255) | YES | Set on success |
| amount_paise | INT | NO | |
| currency | VARCHAR(3) | NO | DEFAULT 'INR' |
| status | ENUM('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED') | NO | |
| gateway_response | JSONB | YES | Full Razorpay webhook payload |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `razorpay_order_id` (UNIQUE), `razorpay_payment_id` (UNIQUE), `status`

---

### Table: `reviews`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| listing_id | UUID | NO | FK → marketplace_listings.id |
| buyer_id | UUID | NO | FK → users.id |
| purchase_id | UUID | NO | FK → purchases.id (verifies purchase) |
| content | TEXT | NO | |
| is_visible | BOOLEAN | NO | DEFAULT true |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Constraints:** UNIQUE(listing_id, buyer_id) — one review per purchase
**Indexes:** `listing_id`, `buyer_id`

---

### Table: `ratings`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| listing_id | UUID | NO | FK → marketplace_listings.id |
| buyer_id | UUID | NO | FK → users.id |
| purchase_id | UUID | NO | FK → purchases.id |
| score | SMALLINT | NO | CHECK (score BETWEEN 1 AND 5) |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Constraints:** UNIQUE(listing_id, buyer_id)
**Indexes:** `listing_id`

---

### Table: `wishlists`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| listing_id | UUID | NO | FK → marketplace_listings.id ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**PK:** Composite (user_id, listing_id)

---

### Table: `creator_profiles`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | PK, FK → users.id ON DELETE CASCADE |
| display_name | VARCHAR(100) | YES | Public name |
| bio | TEXT | YES | |
| website_url | VARCHAR(500) | YES | |
| payout_upi_id | VARCHAR(255) | YES | UPI ID for payouts (encrypted at rest) |
| total_earnings_paise | BIGINT | NO | DEFAULT 0 (denorm) |
| total_sales | INT | NO | DEFAULT 0 (denorm) |
| is_verified | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

---

### Table: `creator_earnings`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| creator_id | UUID | NO | FK → users.id |
| purchase_id | UUID | NO | FK → purchases.id |
| gross_amount_paise | INT | NO | |
| platform_fee_paise | INT | NO | |
| net_amount_paise | INT | NO | |
| status | ENUM('PENDING','SETTLED') | NO | DEFAULT 'PENDING' |
| settled_at | TIMESTAMPTZ | YES | |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `creator_id`, `(creator_id, status)`, `purchase_id`

---

## NOTIFICATIONS DOMAIN

### Table: `notifications`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| recipient_id | UUID | NO | FK → users.id ON DELETE CASCADE |
| type | VARCHAR(100) | NO | e.g., 'PURCHASE_RECEIVED', 'RESOURCE_UPDATED' |
| title | VARCHAR(255) | NO | |
| body | TEXT | YES | |
| entity_type | VARCHAR(50) | YES | 'LISTING', 'PURCHASE', etc. |
| entity_id | UUID | YES | The related entity's ID |
| is_read | BOOLEAN | NO | DEFAULT false |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `(recipient_id, is_read)`, `(recipient_id, created_at DESC)`

---

### Table: `notification_preferences`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| user_id | UUID | NO | PK, FK → users.id ON DELETE CASCADE |
| email_purchases | BOOLEAN | NO | DEFAULT true |
| email_resource_updates | BOOLEAN | NO | DEFAULT true |
| email_marketing | BOOLEAN | NO | DEFAULT false |
| inapp_purchases | BOOLEAN | NO | DEFAULT true |
| inapp_resource_updates | BOOLEAN | NO | DEFAULT true |
| inapp_security | BOOLEAN | NO | DEFAULT true |
| updated_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

---

## AUDIT DOMAIN

### Table: `audit_logs`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | BIGSERIAL | NO | PK (sequential — high volume, no security risk) |
| user_id | UUID | YES | NULL for system actions |
| action | VARCHAR(100) | NO | e.g., 'USER_LOGIN', 'RESOURCE_DELETED' |
| entity_type | VARCHAR(50) | YES | |
| entity_id | UUID | YES | |
| old_value | JSONB | YES | State before change |
| new_value | JSONB | YES | State after change |
| ip_address | INET | YES | |
| user_agent | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `user_id`, `action`, `entity_type`, `created_at DESC`
**Note:** BIGSERIAL PK here — audit logs are append-only, very high volume, UUID would waste space.

---

### Table: `login_history`
| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | BIGSERIAL | NO | PK |
| user_id | UUID | YES | NULL on failed attempt (unknown user) |
| email_attempted | VARCHAR(255) | YES | |
| is_success | BOOLEAN | NO | |
| failure_reason | VARCHAR(100) | YES | |
| ip_address | INET | YES | |
| device_id | UUID | YES | FK → devices.id |
| created_at | TIMESTAMPTZ | NO | DEFAULT NOW() |

**Indexes:** `user_id`, `(ip_address, created_at)` — for brute force detection, `created_at DESC`
