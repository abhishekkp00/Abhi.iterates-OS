# Information Architecture & Sitemap — AbhiIterates.OS

---

## Navigation Hierarchy

```
AbhiIterates.OS
│
├── PUBLIC ZONE (unauthenticated)
│   ├── / (Landing Page)
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   ├── /reset-password?token=
│   ├── /marketplace (browse only, no purchase)
│   └── /creator/:username (public creator profile)
│
├── AUTHENTICATED ZONE
│   │
│   ├── /dashboard
│   │   ├── Continue Reading (widget)
│   │   ├── Recent Resources (widget)
│   │   ├── Recent AI Chats (widget)
│   │   ├── Bookmarks (widget)
│   │   ├── Study Stats (widget)
│   │   └── Quick Actions (widget)
│   │
│   ├── /library
│   │   ├── /library (all semesters overview)
│   │   ├── /library/:semesterId
│   │   │   └── /library/:semesterId/:subjectId
│   │   │       └── /library/:semesterId/:subjectId/:resourceId
│   │   │           └── [PDF Workspace]
│   │   └── /library/search?q=
│   │
│   ├── /marketplace
│   │   ├── /marketplace (browse all)
│   │   ├── /marketplace/search?q=
│   │   ├── /marketplace/category/:slug
│   │   ├── /marketplace/resource/:id (product page)
│   │   ├── /marketplace/checkout/:id
│   │   ├── /marketplace/purchases (my purchases)
│   │   └── /marketplace/wishlist
│   │
│   ├── /ai
│   │   ├── /ai (new conversation)
│   │   ├── /ai/:conversationId (existing conversation)
│   │   └── /ai/history (all conversations)
│   │
│   ├── /bookmarks
│   │   ├── All bookmarks across all resources
│   │   └── Filterable by resource / subject
│   │
│   ├── /notifications
│   │
│   ├── /search?q= (global search)
│   │
│   ├── /settings
│   │   ├── /settings/profile
│   │   ├── /settings/account
│   │   ├── /settings/security
│   │   ├── /settings/notifications
│   │   ├── /settings/billing
│   │   └── /settings/appearance
│   │
│   └── /creator (Creator-only zone, requires CREATOR role)
│       ├── /creator/dashboard
│       ├── /creator/resources
│       │   ├── /creator/resources/new (upload)
│       │   └── /creator/resources/:id/edit
│       ├── /creator/analytics
│       └── /creator/earnings
│
└── ADMIN ZONE (requires ADMIN role)
    ├── /admin/dashboard
    ├── /admin/users
    │   └── /admin/users/:id
    ├── /admin/resources
    │   └── /admin/resources/:id/review
    ├── /admin/marketplace
    ├── /admin/reports
    └── /admin/settings
```

---

## Sidebar Navigation (Authenticated User)

```
┌─────────────────────────┐
│  ⬡ AbhiIterates.OS      │  ← Brand / Logo
├─────────────────────────┤
│  [Avatar] Arjun Mehta   │  ← User chip (click → profile)
│  arjun@gmail.com        │
├─────────────────────────┤
│  ⌘K Search...           │  ← Global search trigger
├─────────────────────────┤
│  MAIN                   │
│  ⊞ Dashboard            │  /dashboard
│  📚 Library             │  /library
│  🛒 Marketplace         │  /marketplace
│  🤖 AI Workspace        │  /ai
│  🔖 Bookmarks           │  /bookmarks
├─────────────────────────┤
│  LIBRARY                │  ← Collapsible tree
│  ▼ Semester 5           │
│    ├─ Operating Systems │
│    ├─ DBMS              │
│    └─ Computer Networks │
│  ▶ Semester 4           │  ← Collapsed
├─────────────────────────┤
│  QUICK ACTIONS          │
│  ＋ Upload Resource      │
│  ＋ New Semester        │
├─────────────────────────┤
│  ──────────────────     │
│  🔔 Notifications  (3)  │
│  ⚙  Settings           │
│  ← Logout              │
└─────────────────────────┘
```

---

## Top Navigation Bar

```
┌─────────────────────────────────────────────────────────────┐
│  [Breadcrumb: Library > Sem 5 > DBMS]        [🔔] [Avatar] │
└─────────────────────────────────────────────────────────────┘
```

Breadcrumb rules:
- Appears only in nested contexts (resource page, subject page)
- Each crumb is a clickable link
- Maximum 3 levels shown — truncate middle with `...` if deeper

---

## Command Palette (⌘K / Ctrl+K)

Triggered globally. Searchable list of:
```
RECENT
  → DBMS Unit 4 Notes.pdf              [open]
  → Operating Systems — Scheduling     [open]

ACTIONS
  → Upload Resource                    [action]
  → New Semester                       [action]
  → New AI Conversation                [action]

NAVIGATE
  → Dashboard                          [page]
  → Marketplace                        [page]
  → Settings                           [page]
  → Creator Dashboard                  [page]

SEARCH
  → Search for "normalization"...      [search]
```

Keyboard behavior:
- ↑↓ to navigate
- Enter to execute
- Esc to close
- First keystroke filters all results instantly

---

## Complete Sitemap

```
PUBLIC
  /                           Landing page
  /login                      Email/password + Google OAuth login
  /register                   Registration with role selection
  /forgot-password            Send reset email
  /reset-password             Reset password via token
  /marketplace                Public marketplace browse (no auth needed)
  /creator/:username          Public creator profile page

AUTHENTICATED — STUDENT
  /dashboard                  Personalized home screen
  /library                    Semester grid overview
  /library/:semId             Subjects inside semester
  /library/:semId/:subId      Resources inside subject
  /library/:semId/:subId/:rid PDF workspace (full-screen reader)
  /library/search             Full-text resource search
  /marketplace                Full marketplace with purchase
  /marketplace/search         Search results page
  /marketplace/category/:slug Category browsing page
  /marketplace/resource/:id   Product detail page
  /marketplace/checkout/:id   Checkout + payment page
  /marketplace/purchases      My purchased resources
  /marketplace/wishlist       Saved resources
  /ai                         New AI conversation
  /ai/:conversationId         Existing AI conversation
  /ai/history                 All past conversations
  /bookmarks                  All bookmarks, cross-resource
  /notifications              Notification center
  /search                     Global search results
  /settings/profile           Edit name, bio, avatar
  /settings/account           Email, delete account
  /settings/security          Password, sessions, 2FA
  /settings/notifications     Notification preferences
  /settings/billing           Payment methods, invoices
  /settings/appearance        Theme, font size, language

AUTHENTICATED — CREATOR (additional)
  /creator/dashboard          Creator home with stats
  /creator/resources          All listed resources
  /creator/resources/new      Upload + list new resource
  /creator/resources/:id/edit Edit listing metadata
  /creator/analytics          Views, conversions, traffic
  /creator/earnings           Revenue, payouts, invoices

ADMIN
  /admin/dashboard            Platform overview stats
  /admin/users                User management table
  /admin/users/:id            Individual user detail
  /admin/resources            All platform resources
  /admin/resources/:id/review Review + approve/reject listing
  /admin/marketplace          Marketplace management
  /admin/reports              Revenue and usage reports
  /admin/settings             Platform configuration

ERROR ROUTES
  /404                        Not found
  /403                        Forbidden
  /500                        Server error
  /maintenance                Maintenance mode
```

---

## Route Protection Rules

| Route Pattern | Auth Required | Role Required |
|---|---|---|
| `/` | No | — |
| `/login`, `/register` | No (redirect if authed) | — |
| `/marketplace` (browse) | No | — |
| `/marketplace` (purchase) | Yes | USER |
| `/dashboard` | Yes | USER |
| `/library/**` | Yes | USER |
| `/ai/**` | Yes | USER |
| `/creator/**` | Yes | CREATOR |
| `/admin/**` | Yes | ADMIN |

---

## Deep Linking Behavior

| Scenario | Behavior |
|---|---|
| Unauthenticated user visits `/library/3/7/42` | Redirect to `/login?redirect=/library/3/7/42`, then forward after auth |
| User with USER role visits `/creator/dashboard` | Redirect to `/dashboard` with "Upgrade to Creator" prompt |
| User with USER role visits `/admin/users` | Redirect to `/403` |
| User visits `/marketplace/resource/99` (not purchased) | Shows product page with preview + purchase CTA |
| User visits `/marketplace/resource/99` (purchased) | Shows product page with "Open in Library" button |

---

## Back Navigation Rules

- Browser back button always works (no `pushState` traps)
- PDF workspace has its own back button in toolbar → goes to parent subject
- Modals close with Esc and do NOT push to browser history
- Checkout flow blocks back navigation during payment processing (standard e-commerce pattern)
- Settings pages save in real-time (no save button needed) to avoid "unsaved changes" back navigation issues
