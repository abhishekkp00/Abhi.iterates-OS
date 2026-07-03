# Screen Inventory — AbhiIterates.OS

Every screen, its purpose, components, actions, and API dependencies.
This document is the implementation contract for the frontend team.

---

## SCR-001: Landing Page `/`

**Purpose:** Convert visitors into registered users. Communicate product value in under 10 seconds.

**Components:**
- Navigation: Logo, "Sign In" link, "Get Started" CTA button
- Hero section: headline, subheadline, animated product demo (PDF reader + AI chat)
- Feature grid: 6 cards (Library, AI Chat, Marketplace, PDF Tools, Collaboration, Creator)
- Social proof: "Join 10,000+ students" with institution logos
- Marketplace preview: 4 featured resource cards
- Creator section: "Sell your notes. Earn every day." with earnings preview
- Footer: links, legal, social

**Buttons / Actions:**
- "Get Started Free" → `/register`
- "Sign In" → `/login`
- "Browse Marketplace" → `/marketplace`
- "Become a Creator" → `/register?role=creator`

**API Dependencies:** None (static page)

**Design Notes:**
- Dark background. Product screenshots must look premium.
- The animated demo must loop automatically. No sound.
- Mobile: stack everything vertically. Hero CTA must be thumb-reachable.

---

## SCR-002: Login Page `/login`

**Purpose:** Authenticate returning users efficiently.

**Components:**
- Brand logo + product name
- "Welcome back" heading
- Google OAuth button (primary, above the fold)
- Divider: "or continue with email"
- Email input
- Password input + show/hide toggle
- "Forgot password?" link
- "Sign in" submit button
- "Don't have an account? Register" link
- Error banner (invalid credentials)

**Buttons / Actions:**
- Google Sign In → OAuth popup → success: `/dashboard`, failure: error banner
- Sign In → POST `/api/v1/auth/login` → success: `/dashboard`, failure: error banner
- Forgot password → `/forgot-password`
- Register link → `/register`

**API Dependencies:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`

**Design Notes:**
- Do NOT use a modal for login. Full page login is more professional for a SaaS product.
- Split screen layout on desktop: left = product value prop image/illustration, right = form.
- Mobile: centered card, no split.
- Google button must use official Google brand colors and icon (compliance requirement).

---

## SCR-003: Register Page `/register`

**Purpose:** Create a new user account.

**Components:**
- Google OAuth button (primary)
- Divider
- Full name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- Role selector: "I am a Student / Creator" toggle (default: Student)
- Terms of service checkbox
- "Create account" submit button
- "Already have an account? Sign in" link
- Error banner / field-level validation errors

**Buttons / Actions:**
- Create Account → POST `/api/v1/auth/register` → success: onboarding, failure: field errors
- Google Sign Up → same as Google Sign In (account created if new)
- Sign In link → `/login`

**API Dependencies:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/google`

---

## SCR-004: Onboarding Flow `/onboarding`

**Purpose:** Guide new users to their first value moment in under 2 minutes.
Shown only once after registration. Skippable.

**Step 1 — Academic Profile:**
- Heading: "What are you studying?"
- Discipline selector grid: Engineering, Medical, Commerce, Law, MBA, Other
- Year selector: 1st, 2nd, 3rd, 4th, 5th+
- "Next →" button

**Step 2 — Create First Semester:**
- Heading: "Set up your library"
- Semester name input (pre-filled: "Semester 1")
- Subject chips (suggested based on discipline selected)
- "Add custom subject" + input
- "Create Library →" button

**Step 3 — Upload First Resource:**
- Heading: "Upload your first PDF"
- Drag-and-drop zone + "Browse files" link
- OR: "Skip for now" link
- Progress bar on upload
- "Open PDF →" button on completion

**API Dependencies:**
- `POST /api/v1/library/semesters`
- `POST /api/v1/library/subjects`
- `POST /api/v1/library/resources/upload`

---

## SCR-005: Dashboard `/dashboard`

**Purpose:** The home screen. Resume study sessions, see progress, access everything quickly.

**Layout:** Two-column on desktop (content area + right sidebar), single column on mobile.

**Left/Main Area:**
- Header: "Good morning, Arjun 👋" (time-aware greeting)
- Continue Reading widget: last opened PDF with page number and progress bar
- Recent Resources: grid of 6 most recently accessed resources
- Recent AI Chats: 3 most recent conversations with preview of first message

**Right Sidebar:**
- Study stats: hours this week, week streak
- Progress ring: hours today vs daily goal
- Quick bookmarks: 5 most recent bookmarks with jump links
- Quick actions: "Upload PDF", "New AI Chat", "Browse Marketplace"

**Empty State (brand new user):**
- Full-width welcome banner: "Your study workspace is ready. Start by uploading a PDF."
- Three action cards: Upload PDF, Browse Marketplace, Explore AI
- No empty data widgets — show them only after data exists

**Loading State:**
- Skeleton cards matching the layout (no spinners for individual widgets)
- Staggered fade-in of skeleton elements

**API Dependencies:**
- `GET /api/v1/users/me/dashboard` (aggregated endpoint returning all widget data)

---

## SCR-006: Library Overview `/library`

**Purpose:** Browse all semesters and navigate to subjects.

**Components:**
- Page header: "My Library" + "New Semester" button
- Semester grid: card for each semester
  - Semester name, year, subject count, last active date
  - Three-dot menu: Rename, Delete, Archive
- Empty state: "No semesters yet. Create your first semester to start organizing."
- Sort: Recent / Alphabetical

**Actions:**
- "New Semester" → modal: enter semester name → POST creates semester
- Click semester card → `/library/:semId`
- Rename → inline edit
- Delete → confirmation dialog → DELETE request

**API Dependencies:**
- `GET /api/v1/library/semesters`
- `POST /api/v1/library/semesters`
- `PUT /api/v1/library/semesters/:id`
- `DELETE /api/v1/library/semesters/:id`

---

## SCR-007: Subject View `/library/:semId`

**Purpose:** Browse all subjects in a semester and navigate to resources.

**Components:**
- Breadcrumb: Library > Semester 5
- Semester title + edit button
- "Add Subject" button
- Subject cards grid:
  - Subject name, resource count, last modified, color indicator
  - Progress ring (resources accessed / total)
  - Three-dot menu: Rename, Change Color, Delete
- Empty state: "No subjects yet. Add your first subject."

**API Dependencies:**
- `GET /api/v1/library/semesters/:id/subjects`
- `POST /api/v1/library/subjects`
- `PUT/DELETE /api/v1/library/subjects/:id`

---

## SCR-008: Resource View `/library/:semId/:subId`

**Purpose:** Browse all resources in a subject. Primary file management screen.

**Components:**
- Breadcrumb: Library > Semester 5 > DBMS
- Subject title + subject settings
- Upload zone (top): drag-and-drop + "Upload Files" button
- View toggle: Grid / List
- Sort: Date Added, Name, Last Opened
- Filter chips: All, PDF, Notes, Video (future)
- Resource cards (grid):
  - PDF thumbnail, title, file size, highlight count, bookmark count
  - Last opened date
  - Three-dot menu: Open, Rename, Move to, Download, Delete
- Upload progress (inline in resource grid while uploading)
- Empty state: "No resources yet. Drag a PDF here to start."

**API Dependencies:**
- `GET /api/v1/library/subjects/:id/resources`
- `POST /api/v1/library/resources/upload` (multipart form)
- `PUT/DELETE /api/v1/library/resources/:id`

---

## SCR-009: PDF Workspace `/library/:semId/:subId/:resourceId`

**Purpose:** The core product experience. Full PDF reading with annotation and AI.
This is the most complex screen and must be designed with extreme care.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                      │
│  [←Back] [Title: DBMS Unit 1] [Page 12/47] [⊕ Zoom] [☰ More]│
├───────────┬──────────────────────────────────┬───────────────┤
│ LEFT      │         PDF VIEWER               │  RIGHT        │
│ SIDEBAR   │                                  │  SIDEBAR      │
│           │                                  │               │
│ 🔖Bookmarks│    [Page Content Rendered]       │  🤖 AI Chat   │
│ 🖊Highlights│                                  │               │
│ 📋 TOC    │    [User Highlights overlaid]     │  [Response    │
│           │                                  │   streaming   │
│           │    [Annotation markers in margin]│   here...]    │
│           │                                  │               │
├───────────┴──────────────────────────────────┴───────────────┤
│  BOTTOM NAV: [◀ Prev] [Page Input] [Next ▶] [Progress bar]  │
└──────────────────────────────────────────────────────────────┘
```

**Toolbar (top):**
- Back arrow → returns to subject page (with confirmation if AI chat is open)
- Document title (click to rename)
- Page indicator: "12 / 47"
- Zoom controls: – | 100% | +
- Fit width / Fit page toggle
- Dark mode toggle (inverts PDF colors for night reading)
- More menu: Download (if owner), Share, Print (disallowed for purchased content)

**Left Sidebar (collapsible, default closed on mobile):**
- Tab 1: Bookmarks list
  - Each bookmark: page thumbnail + page number + timestamp
  - Click → jump to page
  - Delete button on hover
- Tab 2: Highlights list
  - Each highlight: color indicator + text excerpt + page number
  - Click → jump to page and flash highlight
  - Filter by color
- Tab 3: Table of Contents
  - Rendered from PDF metadata if available
  - Click chapter → jump to page

**Center Viewer:**
- PDF pages rendered by PDF.js
- Text selection triggers annotation toolbar:
  ```
  [🟡 Yellow] [🟢 Green] [🔵 Blue] [🩷 Pink] [✏ Note] [→ Ask AI] [✕ Cancel]
  ```
- Existing highlights are clickable → shows options: "Edit note", "Delete"
- Bookmark icon in page margin (appears on hover, or always visible for bookmarked pages)
- Page margin annotation indicators (sticky note icons)

**Right Sidebar (collapsible, default open when AI is first accessed):**
- AI Chat panel (see SCR-010 for detail)

**Bottom Navigation:**
- Previous page button (← or J key)
- Page number input: type page number + Enter to jump
- Next page button (→ or K key)
- Reading progress bar (full width)

**Keyboard Shortcuts:**
| Key | Action |
|---|---|
| J / → | Next page |
| K / ← | Previous page |
| G then [n] | Go to page n |
| B | Bookmark current page |
| H | Highlight selected text (yellow) |
| A | Open AI panel |
| / | Focus page jump input |
| [ | Zoom out |
| ] | Zoom in |
| F | Toggle fullscreen |
| Esc | Deselect / close overlays |

**Responsive Behavior:**
- Desktop (1024px+): full three-panel layout
- Tablet (768-1024px): left sidebar hidden by default, AI as overlay panel
- Mobile (<768px): single column viewer, toolbars at top and bottom, AI and bookmarks accessible via tab bar at bottom

---

## SCR-010: AI Chat Panel (within PDF Workspace)

**Purpose:** Context-aware AI conversation about the current PDF.

**Layout within right sidebar:**
```
┌────────────────────────┐
│  🤖 AI Workspace       │
│  DBMS Unit 1 — Arjun   │
├────────────────────────┤
│  SUGGESTED PROMPTS     │
│  [Summarize chapter]   │
│  [Key concepts]        │
│  [Generate MCQs]       │
│  [Explain in simple]   │
├────────────────────────┤
│                        │
│  [Message bubble]      │
│  You: Explain 2NF      │
│                        │
│  [AI Response]         │
│  2NF means...          │
│  [Page 12] [Page 14]   │  ← Citation chips
│                        │
│  [Streaming cursor...] │  ← Live while generating
│                        │
├────────────────────────┤
│  [Message input box  ] │
│  [Send] [Clear]        │
└────────────────────────┘
```

**Interactions:**
- Suggested prompts: click → fills input + sends automatically
- Text selection in PDF → "Ask AI" option → selected text pre-filled in input with context
- Citations are clickable → jumps PDF to cited page
- AI response rendered in Markdown (headings, bullets, bold, code blocks, tables)
- Streaming: text appears word by word (not all at once)
- "Clear conversation" → confirmation dialog → resets to empty state
- Conversation history: previous conversations for this resource accessible via dropdown at top

**Loading States:**
- "Preparing document..." (first time only, with spinner and progress text)
- "AI is thinking..." with animated dots while waiting for first token
- Streaming text cursor while generating

**Error States:**
- "AI is temporarily unavailable" → retry button
- "Daily AI limit reached. Upgrade to continue." → link to pricing
- "I couldn't find this in your document." → honest fallback

---

## SCR-011: Marketplace Browse `/marketplace`

**Purpose:** Discovery engine for student notes. Browse, filter, and purchase creator content.

**Layout:**
- Top: search bar (prominent, full width on mobile)
- Below search: category filter chips (horizontal scroll): All, Engineering, Medical, Commerce, UPSC, Law, MBA
- Sort bar: Most Popular, Recently Added, Price: Low to High, Highest Rated
- Resource card grid (3 cols desktop, 2 cols tablet, 1 col mobile)

**Resource Card:**
```
┌──────────────────┐
│  [Preview thumb] │
│  ⭐ 4.8 (124)    │
├──────────────────┤
│  UPSC Polity     │
│  Complete 2024   │
│  By Priya Nair   │
│  📄 380 pages    │
│  ₹ 299           │
├──────────────────┤
│  [Preview] [Buy] │
└──────────────────┘
```

**Actions:**
- Preview button → opens first N pages in a modal viewer (no account needed)
- Buy button → if not logged in: redirect to login → return to this page
- Card click → `/marketplace/resource/:id`

**API Dependencies:**
- `GET /api/v1/marketplace/listings?category=&sort=&page=&size=`
- `GET /api/v1/marketplace/categories`

---

## SCR-012: Resource Detail Page `/marketplace/resource/:id`

**Purpose:** Full product page for a marketplace listing. Drives purchase decisions.

**Components:**
- Resource title (large), creator name (linked to creator profile)
- Star rating + review count
- Price display + "Purchase" CTA
- Preview panel: embedded PDF viewer showing free preview pages
- Description (rich text)
- What's included: chapter list, page count, file format
- About the creator: avatar, bio, resource count, total sales
- Reviews section (Phase 2)
- "You might also like" row (Phase 2)

**State variants:**
- Not purchased: shows preview pages + "Purchase for ₹299" button
- Purchased: preview replaced with "Open in Library" button
- Own listing (creator): shows "Edit Listing" button

**API Dependencies:**
- `GET /api/v1/marketplace/listings/:id`
- `GET /api/v1/marketplace/listings/:id/access` (check if purchased)

---

## SCR-013: Checkout `/marketplace/checkout/:id`

**Purpose:** Complete a purchase. Fast, frictionless, trustworthy.

**Components:**
- Resource summary (thumbnail, title, price)
- Order breakdown: Resource price, Platform fee (clearly labeled), Total
- Payment methods: UPI, Card, Net Banking (via Razorpay widget)
- "Pay ₹XXX" button
- Security badge: "256-bit secure payment"
- Cancellation policy: "Immediate access after payment. No refunds on digital content."

**Flow:** Razorpay modal handles payment UI. Our page handles success/failure webhooks.

---

## SCR-014: All Bookmarks `/bookmarks`

**Purpose:** Cross-resource bookmark management. Find any bookmarked page instantly.

**Components:**
- Search: filter bookmarks by resource name or note text
- Group by: Resource (default), Date, Subject
- Bookmark entry: resource name, page number, page thumbnail, date bookmarked, optional note
- Click bookmark → opens PDF workspace at that exact page

**API Dependencies:**
- `GET /api/v1/bookmarks?userId=` (paginated, all resources)

---

## SCR-015: Settings Pages `/settings/*`

**Profile:** Edit name, bio, avatar upload, college name
**Account:** Email change, account deletion (with confirmation: type "DELETE")
**Security:** Change password, active sessions list, revoke individual sessions
**Notifications:** Toggle email/in-app for: purchases, new resources from followed creators, platform updates
**Billing:** Current plan, payment methods, invoice history
**Appearance:** Theme toggle (dark/light/system), font size (small/medium/large), PDF default zoom

---

## SCR-016: Creator Dashboard `/creator/dashboard`

**Purpose:** Creator home screen showing income, resource performance, and quick actions.

**Components:**
- Stats row: Total Earnings (this month), Total Sales (all time), Active Listings, Avg Rating
- Earnings chart: monthly bar chart (last 6 months)
- Resource performance table: title, views, purchases, conversion rate, revenue
- Quick actions: "Upload New Resource", "View Earnings", "Edit Profile"
- Recent sales feed: "Sneha Iyer purchased UPSC Polity Notes — 2 hours ago"

---

## SCR-017: Admin Dashboard `/admin/dashboard`

**Purpose:** Platform overview for administrators.

**Components:**
- KPI row: Total Users, Active Today, Total Resources, Revenue (MTD)
- Pending approvals: count with quick link
- User growth chart
- Top resources (by sales)
- Recent user registrations
- System health indicator
