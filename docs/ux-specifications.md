# UX Design Specifications — AbhiIterates.OS

Covers: Empty States, Error States, Loading States, PDF Workspace Detail,
AI Workspace Detail, Marketplace UX, Resource Management UX,
Notification System, Global Search, Accessibility, and UX Best Practices.

---

## Section 1: Empty States

The design principle for all empty states:
**Never show a blank page.** Empty states are opportunities to teach users what to do next.
Every empty state must have: an icon, a heading, a subtext, and a primary CTA.

### Dashboard (brand new user)
```
Icon: 🎓 (graduation cap, or a custom illustration)
Heading: "Your study workspace is ready."
Subtext: "Start by uploading your first PDF or exploring the marketplace."
CTA 1: [Upload PDF]  ← primary
CTA 2: [Browse Marketplace]  ← secondary ghost button
```
Design note: First-time dashboard replaces all data widgets with this state. Don't show 6 empty skeleton widgets — show one purposeful welcome screen.

### Library (no semesters)
```
Icon: 📚 (stack of books)
Heading: "Your library is empty."
Subtext: "Create a semester to start organizing your study material."
CTA: [Create Semester]
```

### Subjects (no subjects in semester)
```
Icon: 📂
Heading: "No subjects in Semester 5 yet."
Subtext: "Add subjects to start organizing your resources."
CTA: [Add Subject]
```

### Resources (no resources in subject)
```
Icon: 📄
Heading: "No resources in DBMS yet."
Subtext: "Upload your first PDF or import from the marketplace."
CTA 1: [Upload PDF]  ← with drag hint: "or drag files here"
CTA 2: [Browse Marketplace]
```

### AI Chat (new conversation, no messages)
```
Icon: 🤖
Heading: "Ask anything about this PDF."
Subtext: "I have read your document. Try one of these questions:"
Suggested prompts: [Summarize the chapter] [Key concepts] [Generate MCQs] [Explain in simple terms]
```

### Bookmarks (none saved)
```
Icon: 🔖
Heading: "No bookmarks yet."
Subtext: "Bookmark important pages while reading a PDF — they'll appear here for quick access."
CTA: [Open Library]
```

### Marketplace Purchases (none)
```
Icon: 🛒
Heading: "You haven't purchased anything yet."
Subtext: "Explore thousands of student-created notes for every subject."
CTA: [Browse Marketplace]
```

### Notifications (none)
```
Icon: 🔔
Heading: "All caught up."
Subtext: "You'll be notified when someone purchases your resource, or when a resource you bought is updated."
```

### Search Results (no matches)
```
Icon: 🔍
Heading: 'No results for "normalizaiton"'
Subtext: "Check your spelling, or try a broader search term."
Suggestion row: Recent searches
```

---

## Section 2: Error States

### 404 — Page Not Found
```
Code: 404
Heading: "This page doesn't exist."
Subtext: "The link may be broken, or the page may have been removed."
CTA: [Go to Dashboard]  [Go Back]
```

### 403 — Forbidden
```
Code: 403
Heading: "You don't have access to this."
Subtext: "Your account doesn't have permission to view this page."
CTA: [Go to Dashboard]
Note: If it's a creator-only page, show: "Upgrade to Creator to access this." with upgrade CTA.
```

### 500 — Server Error
```
Code: 500
Heading: "Something went wrong on our end."
Subtext: "This is not your fault. Our team has been notified. Try refreshing."
CTA: [Refresh Page]
Secondary: "If this keeps happening, contact support."
```

### Network Failure
```
Icon: 📡 (no signal)
Heading: "No internet connection."
Subtext: "Check your connection and try again."
CTA: [Retry]
Behavior: Auto-retry every 10 seconds, show countdown.
```

### Payment Failed
```
Icon: 💳
Heading: "Payment was not completed."
Subtext: "No amount was deducted from your account. Check your payment details and try again."
CTA: [Try Again]  [Change Payment Method]
Error detail: Show bank/Razorpay error code for reference.
```

### Upload Failed
```
Icon: ☁️ with X
Heading: "Upload failed."
Subtext: Specific reason: "File too large (max 50MB)" or "Only PDF files are supported" or "Connection lost."
CTA: [Try Again]
Show failed file name so user knows which file to re-upload.
```

### Permission Denied (purchased content)
```
Context: User tries to access a purchased resource but something is wrong.
Heading: "Access error."
Subtext: "We couldn't verify your access to this resource. Please try again or contact support."
CTA: [Retry]  [Contact Support]
```

### Authentication Expired
```
Behavior: Access token expired, refresh token attempt failed.
Toast: "Your session has expired. Signing you out..."
Action: Clear local state, redirect to /login?redirect=[current URL]
Do NOT show a full error page — this should be a toast + redirect.
```

### AI Service Unavailable
```
Context: Inside AI chat panel.
Heading: "AI is temporarily unavailable."
Subtext: "Our AI service is experiencing high load. Please try again in a few minutes."
CTA: [Retry]
Auto-retry: After 30 seconds, automatically retry and remove error if service is back.
```

---

## Section 3: Loading States

### Skeleton Screens (preferred over spinners for page-level loading)
```
Dashboard:       Render skeleton cards matching the exact layout
Library:         Skeleton semester grid (3 cards minimum)
Subject view:    Skeleton resource grid
PDF Workspace:   Grey placeholder replacing PDF canvas, then fade in
Marketplace:     Skeleton resource cards
AI response:     Animated "thinking" dots, then streaming text
```

**Skeleton rules:**
- Background: #1a1a1a (surface-2)
- Shimmer animation: horizontal gradient sweep, 1.5s loop
- Border radius matches the real component
- Never animate more than 6 skeleton elements simultaneously

### PDF Loading
```
Step 1: PDF canvas shows grey placeholder with subtle shimmer
Step 2: First page renders → rest of pages load progressively
Step 3: Thumbnail sidebar populates as pages render
Never block the user from scrolling to page 1 while rest loads
```

### AI Response Loading
```
Step 1: User sends message → button shows spinner, input disabled
Step 2: "AI is thinking..." with animated dots (3 dots, staggered)
Step 3: First token arrives → cursor appears, streaming begins
Step 4: Streaming complete → cursor disappears, citations appear
```

### File Upload Progress
```
In-place progress: replace the empty upload zone with:
  [Filename.pdf]  ████████░░░░ 67%  [Cancel]
Multiple files: stacked progress bars
On completion: fade-out progress → fade-in completed file card
```

### Optimistic Updates
```
Apply immediately where data loss is acceptable:
  - Bookmark added → show immediately, sync in background
  - Highlight added → render immediately, sync in background
  - Task marked complete → update immediately
  
Roll back with error toast if sync fails:
  "Couldn't save your bookmark. Check your connection."  [Retry]
```

### Button Loading States
```
Never disable a button and leave the user confused.
Pattern: [Pay ₹299] → clicked → [◌ Processing...] (spinner + text)
All action buttons must have a loading variant.
```

---

## Section 4: PDF Workspace — Full UX Specification

### Reading Modes
```
Normal Mode:    Sidebar + viewer + controls visible
Focus Mode:     All UI hidden except the PDF. Press F to toggle.
Night Mode:     PDF colors inverted. Background becomes #1a1a1a.
Two-page Mode:  Shows two pages side by side (desktop only, 1280px+)
```

### Highlight Annotation Workflow
```
1. User selects text with cursor (or double-tap on mobile)
2. Annotation toolbar appears above the selection:
   ┌────────────────────────────────────────┐
   │  🟡  🟢  🔵  🩷  |  ✏ Note  →AI  ✕  │
   └────────────────────────────────────────┘
3. User clicks color → highlight rendered
4. Database write (optimistic): returns immediately
5. Toolbar dismisses
6. On hover/tap of existing highlight:
   ┌─────────────────────────┐
   │  Change color  Add note  │
   │  Copy text    Delete     │
   └─────────────────────────┘
```

### Bookmark Workflow
```
1. Bookmark icon appears in left margin of every page on hover
2. Click → page bookmarked → icon turns solid/filled
3. Bookmark appears in left sidebar immediately
4. Optional: click bookmark to add label: "Chapter 4 intro"
5. Click bookmark in sidebar → smooth scroll to that page (animated)
```

### AI Integration Workflow (from PDF)
```
Workflow A — Open AI chat:
  Click AI button in toolbar → right panel slides in
  
Workflow B — Ask about selection:
  Select text → annotation toolbar → click "→ AI"
  Selected text fills the AI input automatically:
  "[SELECTED TEXT] — What does this mean?"
  User can edit before sending
  
Workflow C — Page context:
  AI panel open → AI has context of current page
  Responses cite specific page numbers
```

### Keyboard Navigation (Full Map)
```
Reading:
  J or →      Next page
  K or ←      Previous page
  G [number]  Go to specific page
  Home        First page
  End         Last page
  
Zoom:
  [ or -      Zoom out
  ] or +      Zoom in
  0           Reset zoom to fit width
  
Annotations:
  B           Bookmark current page
  H           Highlight selected text (yellow)
  Ctrl+Z      Undo last annotation
  
Navigation:
  A           Toggle AI panel
  L           Toggle left sidebar
  F           Toggle focus mode
  /           Jump to page input
  Esc         Close any open overlay
```

---

## Section 5: AI Workspace — Full UX Specification

### Conversation Architecture
```
Each conversation is linked to exactly ONE resource.
  resource_id + user_id → conversation
  
Multiple conversations allowed per resource:
  "DBMS Session 1 — Normalization"
  "DBMS Session 2 — Transactions"
  
Standalone AI conversations (not linked to a resource):
  Available from /ai page → general knowledge AI
  No RAG pipeline — pure LLM response
```

### Prompt Engineering for Suggested Prompts
```
Context-aware suggestions (change based on document type):
  
For academic PDFs:
  → "Summarize this chapter in bullet points"
  → "What are the key concepts I should know?"
  → "Explain the most complex idea in simple terms"
  → "Create 5 MCQs from this content"
  → "What questions might appear in an exam?"
  
For technical PDFs:
  → "Explain the architecture described here"
  → "What are the tradeoffs mentioned?"
  → "Summarize the algorithm in steps"
```

### Citation Display
```
When AI cites a page:
  Inline: "The concept of normalization was introduced [Page 12]"
  [Page 12] is a clickable chip → jumps PDF to that page
  
Citation chip design:
  Background: accent-muted (#6366f1 at 10% opacity)
  Text: accent color (#6366f1)
  Hover: underline + pointer cursor
  Click: PDF viewer scrolls to that page (right panel stays open)
```

### Streaming UX
```
Do NOT buffer the entire response — stream it.
Rendering order:
  1. First token → start rendering markdown progressively
  2. Headings render bold immediately
  3. Bullet points render as they complete
  4. Code blocks render complete (not character by character)
  5. Citations appear at the end of each relevant sentence
  
Abort: User can click "Stop generating" button
  → AI stops mid-response
  → Incomplete response is shown
  → Input re-enabled immediately
```

### Conversation Export (Phase 2)
```
Export options:
  → Copy entire conversation (plain text)
  → Export as PDF (formatted with resource name, date, conversation)
  → Export as Markdown file
```

---

## Section 6: Marketplace UX — Full Specification

### Browse Experience
```
Layout: Masonry or equal-height grid. Equal-height preferred (Stripe-style).
Cards: 3 columns desktop, 2 tablet, 1 mobile.
Card height: fixed (220px) — content truncated with ellipsis.
Infinite scroll preferred over pagination for discovery.
Pagination for search results (better for specific intent).
```

### Product Card Design
```
┌─────────────────────────────────┐
│ [PDF Preview Thumbnail - 3:4]   │ ← First page of the PDF, blurred after page 1
│ ⭐ 4.8 · 124 reviews            │
├─────────────────────────────────┤
│ UPSC Polity — Complete 2024     │ ← Title, 2 lines max
│ By Priya Nair                   │ ← Linked to creator profile
│ 📄 380 pages · UPSC             │ ← Metadata
│ ₹ 299                           │ ← Price (bold)
├─────────────────────────────────┤
│ [Preview]  [Add to Wishlist 🤍] │
└─────────────────────────────────┘
```

### Preview Flow
```
Click "Preview" → modal opens:
  Left: embedded PDF viewer (first N pages only)
  Right: resource info (title, creator, price, description)
  Below: "Purchase for ₹299" CTA
  
Preview pages: creator sets between 3-15 pages
"Showing preview — pages 1 to 10 of 380"
Navigation inside preview: left/right page buttons
Close: Esc or × button
```

### Purchase Flow (optimized for conversion)
```
Goal: Minimum steps to payment. Every added step = lost conversion.

Step 1: Product page → "Purchase for ₹299"
Step 2: If not logged in → login sheet slides up (not redirect!) → auto-returns to product
Step 3: Checkout page:
  - Pre-filled: resource name, price
  - No shipping (digital goods)
  - Payment selection (Razorpay handles this)
  - One "Pay Now" button
Step 4: Razorpay modal → payment
Step 5: Success screen with confetti → "Open in Library" button
        Email confirmation sent in background

Total steps: 3-4 max from product page to access.
```

---

## Section 7: Resource Management UX — Full Specification

### Semester → Subject → Resource Hierarchy
```
Library
  └── Semester (academic period)
        └── Subject (course within semester)
              └── Resource (file: PDF, note, etc.)

Flat access also supported:
  → Recently Accessed (across all semesters)
  → Search (across all semesters and subjects)
  → Bookmarks (cross-resource)
```

### Upload Flow
```
Trigger points:
  1. Drag PDF anywhere onto a subject page
  2. Click "Upload Files" button
  3. Drag PDF onto dashboard quick-upload zone
  4. From command palette: "Upload Resource"

Upload modal / inline behavior:
  Multiple files: shown as stacked upload items, each with progress
  
File validation (client-side before upload):
  → File type: PDF only in MVP (DOCX, PPTX in Phase 2)
  → File size: max 50MB
  → Instant feedback: "File type not supported" or "File too large"
  
After upload:
  → File appears in grid with "Processing..." badge
  → Thumbnail generated server-side
  → Badge updates to resource details
```

### Context Menu (right-click or three-dot menu)
```
On resource card:
  Open
  ── separator ──
  Rename
  Move to Subject...   ← shows subject picker modal
  Duplicate            ← creates copy (Phase 2)
  ── separator ──
  Download             ← only for own uploads (not purchased)
  Share link           ← generates view-only link (Phase 2)
  ── separator ──
  Add to Favorites     ← quick access
  Archive              ← hide without delete
  ── separator ──
  Delete               ← confirmation required
```

### Tagging System (Phase 2)
```
Tags are user-defined labels applied to resources.
Examples: "exam important", "chapter 4", "revision", "difficult"

Filtering by tag: sidebar filter chips
Search by tag: #exam in search bar
Cross-subject tag view: see all resources tagged "exam important"
```

---

## Section 8: Notification System

### Notification Types
```
SYSTEM
  → Platform updates / maintenance alerts
  → Security alerts (new login from new device)

MARKETPLACE
  → Your resource was purchased (creator)
  → Resource you purchased was updated (buyer)
  → Price drop on a wishlisted item (Phase 2)
  → New resource from a creator you follow (Phase 2)

SOCIAL (Phase 2)
  → Someone commented on your shared resource
  → Collaboration invite received
  → Collaborator added a highlight to shared resource

ACHIEVEMENT (Phase 2)
  → Study streak milestone
  → First sale (creator)
```

### Notification Center Design
```
Bell icon in top nav with unread count badge (max display: 99+)

Notification panel (slide-in from right, not a separate page):
┌────────────────────────────────┐
│  Notifications        [Mark all read]  │
│  ─────────────────────────────│
│  ● Sneha Iyer purchased       │  ← unread (dot)
│    UPSC Polity Notes           │
│    2 hours ago                 │
│  ─────────────────────────────│
│    Platform will be            │  ← read (no dot)
│    unavailable on Sunday 2am   │
│    1 day ago                   │
└────────────────────────────────┘

Grouping: group notifications from same source within 24hrs
"3 people purchased UPSC Polity Notes today"
```

### Notification Preferences (in Settings)
```
Email notifications:
  ☑ Purchase alerts
  ☑ Resource updates
  ☐ Marketing / product updates

In-app notifications:
  ☑ All (default)
  or individually toggle each type
```

---

## Section 9: Global Search

### Search Experience
```
Trigger: ⌘K (Mac) / Ctrl+K (Windows) anywhere on platform
         OR click search bar in sidebar

Search modal (full-screen overlay, center of screen):
┌─────────────────────────────────────────┐
│  🔍 Search resources, subjects, PDFs... │
│  ─────────────────────────────────────  │
│  RECENT SEARCHES                        │
│  normalization                          │
│  UPSC Polity Notes                      │
│  ─────────────────────────────────────  │
│  [results appear here as user types]   │
└─────────────────────────────────────────┘
```

### Search Result Categories
```
Results organized into sections:
  RESOURCES (PDFs matching the search term by name)
  MARKETPLACE (listings matching the search term)
  HIGHLIGHTS (your saved highlights containing the search term)
  SUBJECTS (subjects matching the name)
  CREATORS (Phase 2)
```

### Search Filters
```
Available after searching:
  Filter by type: Resources | Marketplace | Highlights
  Filter by date: This week | This month | All time
  Filter by subject (for Resources)
  Filter by category (for Marketplace)
```

---

## Section 10: Accessibility

### Keyboard Navigation
```
All interactive elements reachable by Tab key in logical order.
Focus ring: visible 2px solid #6366f1 ring on all focused elements.
Tab order follows visual reading order (left to right, top to bottom).
Modal opens → focus moves to first element inside modal.
Modal closes → focus returns to the trigger element.
Dropdown opens → Arrow keys navigate options, Enter selects, Esc closes.
```

### ARIA Labels
```
Icon-only buttons: aria-label="Bookmark this page"
PDF page: aria-label="Page 12 of 47"
Highlight: aria-label="Yellow highlight on page 12: [highlighted text]"
AI response loading: aria-live="polite" aria-label="AI is generating a response"
Notification count: aria-label="3 unread notifications"
Progress bar: role="progressbar" aria-valuenow="67" aria-valuemax="100"
```

### Color Contrast
```
All text meets WCAG AA minimum:
  text-primary (#fafafa) on bg (#0a0a0a):  19.6:1  ✅ WCAG AAA
  text-secondary (#a1a1aa) on bg:           7.2:1  ✅ WCAG AA
  text-muted (#71717a) on bg:               4.6:1  ✅ WCAG AA (large text)
  accent (#6366f1) on bg:                   4.1:1  ✅ WCAG AA (large text)

Never use color alone to convey state.
Error states: red border + error text + icon (not just red border).
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All transitions, animations disabled */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  /* Streaming text: show all at once instead of character-by-character */
}
```

### Screen Reader Support
```
Semantic HTML: Use <main>, <nav>, <aside>, <article>, <section> properly.
Headings: Proper h1 → h2 → h3 hierarchy. Never skip levels.
Images: All decorative images have alt="". All informative images have descriptive alt.
Tables: Use <th scope="col"> for column headers.
Forms: Every input has an associated <label> (not just placeholder).
PDF viewer: announce "Now reading page 12 of 47" on page change.
```

---

## Section 11: UX Best Practices & Design Rationale

### Why Split-Screen Login (not modal)?
**Decision:** Full-page login with split screen (form right, value left).
**Rationale:** Modal login feels temporary and low-commitment. Full-page login signals this is a product worth creating an account for. Linear, Notion, Vercel all use full-page login.
**Alternative considered:** Slide-in drawer login.
**Why rejected:** Drawer login with redirect handling is more complex and feels off for a primary authentication action.

### Why Sidebar (not top navbar)?
**Decision:** Fixed left sidebar for primary navigation.
**Rationale:** Students have many subjects and semesters. The sidebar accommodates a tree navigation for the library hierarchy — something impossible in a top navbar. Desktop-first design for study use cases. Reference: Notion, Linear, VS Code.
**Tradeoff:** Sidebar takes horizontal space. Mitigated by collapsible design.
**Mobile:** Sidebar becomes a bottom tab bar on mobile (<768px).

### Why Optimistic Updates for Highlights?
**Decision:** Highlights render immediately, sync in background.
**Rationale:** A 300ms delay on every highlight would make the annotation experience feel laggy and frustrating. Students annotate rapidly during study sessions. The cost of an optimistic update failing (rare) is a brief rollback — far better than making every highlight feel slow.
**Risk:** Network failure could cause highlight to disappear. Mitigated by: retry logic, error toast, local queue.

### Why No Refunds on Marketplace?
**Decision:** No refund policy on digital content.
**Rationale:** Digital content cannot be "returned" — once read, it cannot be unread. This is standard e-commerce practice for digital goods (Udemy, Gumroad, Teachable all use the same policy).
**Mitigation:** Preview pages (3-15 pages visible before purchase) reduce regret purchases. Clear preview policy displayed on checkout.

### Why RAG over Fine-Tuning for AI?
**Decision:** Retrieval-Augmented Generation (RAG) using the user's uploaded PDFs.
**Rationale:** Fine-tuning would require retraining a model for every document — computationally prohibitive. RAG retrieves relevant chunks from the specific PDF at query time, grounds responses in the actual document, and provides citations. It is the correct architecture for document-specific Q&A.
**Limitation:** RAG can fail if the PDF is poorly structured (scanned images with no OCR). Mitigated by OCR processing pipeline.

### Why Razorpay over Stripe?
**Decision:** Razorpay for payment processing.
**Rationale:** Our primary users are Indian college students. Razorpay has native UPI support (the dominant payment method in India), supports Indian bank accounts for creator payouts, has a generous free tier, and has a simpler integration for Indian businesses. Stripe requires US/EU-linked accounts.
**Future:** Stripe may be added for international expansion.
