# MVP Scope — AbhiIterates.OS

This document defines exactly what is inside and outside the MVP.
Every feature request must be measured against this document.
Scope creep is the primary cause of abandoned projects.

---

## MVP Definition

The MVP (Minimum Viable Product) is the smallest version of the product that:

1. Solves a real problem for a real user
2. Is production-quality (not a demo or prototype)
3. Can be used to validate the product hypothesis
4. Can generate initial revenue or user acquisition

The MVP must be completable in **4 weeks** by one developer.

---

## In Scope — MVP

### Module: Authentication

| Feature | Priority | Notes |
|---|---|---|
| Email + Password Registration | P0 | With email validation, password strength |
| Email + Password Login | P0 | |
| Google OAuth Login | P0 | Via Google Identity Services |
| JWT Access Tokens (15min) | P0 | Stateless validation |
| JWT Refresh Tokens (30 days) | P0 | Rotation on every use |
| Logout (invalidate refresh token) | P0 | |
| Protected Routes (frontend) | P0 | |
| Role-Based Access (USER, CREATOR, ADMIN) | P0 | Enforced at API layer |

### Module: Dashboard

| Feature | Priority | Notes |
|---|---|---|
| User Dashboard | P0 | Study stats, recent activity |
| Navigation Shell | P0 | Sidebar, header, responsive |
| User Profile Page | P1 | View/edit name, avatar |

### Module: Library

| Feature | Priority | Notes |
|---|---|---|
| Subject/Category Creation | P0 | Organize resources |
| Resource Upload (PDF) | P0 | PDF files only in MVP |
| Resource Listing | P0 | Grid view with filters |
| Resource Detail View | P0 | Metadata, preview |
| Resource Delete | P0 | Owner only |
| Resource Search | P1 | Full-text search on title + description |
| Storage via Supabase | P0 | Signed URLs only |

### Module: PDF Workspace

| Feature | Priority | Notes |
|---|---|---|
| PDF Rendering (PDF.js) | P0 | All pages, zoom in/out |
| Page Navigation | P0 | Previous/next, jump to page |
| Highlight Text | P0 | Color-coded highlights |
| Add Annotations / Notes | P1 | Per-page text notes |
| Bookmark Pages | P0 | Save and navigate to bookmarks |
| Persist highlights + bookmarks | P0 | Saved to PostgreSQL |

### Module: Marketplace

| Feature | Priority | Notes |
|---|---|---|
| Creator Resource Listing | P0 | Creators list resources for sale |
| Resource Pricing | P0 | Set price per resource |
| Browse Marketplace | P0 | All listed resources |
| Resource Purchase | P0 | Razorpay integration |
| Access Control Post-Purchase | P0 | Purchased resources unlock in Library |
| Purchase History | P1 | User's purchase list |

### Module: AI Workspace

| Feature | Priority | Notes |
|---|---|---|
| AI Chat with PDF | P0 | Ask questions about a specific PDF |
| AI Summary Generation | P0 | Summarize entire document |
| Context-Aware Responses | P0 | RAG pipeline via FAISS |
| AI Usage Limits | P0 | Rate limited per user per day |

---

## Out of Scope — MVP (Phase 2+)

| Feature | Phase | Reason Deferred |
|---|---|---|
| Ratings & Reviews | 2 | Requires purchase volume to be meaningful |
| Creator Analytics Dashboard | 2 | Requires data accumulation |
| Collaborative Reading | 2 | WebSocket complexity |
| Shared Notes | 2 | Requires collaboration infrastructure |
| Flashcard Generator | 2 | Requires PDF parsing pipeline maturity |
| Quiz Generator | 2 | Requires AI pipeline maturity |
| Study Streaks & Analytics | 2 | Requires usage data to be meaningful |
| Voice AI | 3 | WebRTC + STT/TTS infrastructure |
| Mobile App | 3 | Requires proven web product first |
| Institution Dashboard | 3 | Requires B2B sales and onboarding |
| Attendance Tracking | 3 | Out of core product vision |
| Timetable | 3 | Out of core product vision |
| Recommendation Engine | 3 | Requires ML pipeline |
| Offline Reading | 3 | Service Worker complexity |
| AI Tutor (Conversational) | 3 | Requires AI pipeline maturity |

---

## Quality Gates

**A feature is only considered complete when:**

- [ ] Backend API is implemented with validation and error handling
- [ ] Frontend UI is implemented with loading, error, and empty states
- [ ] The feature works on mobile viewports (375px+)
- [ ] The feature is accessible (keyboard navigation, screen reader compatible)
- [ ] No hardcoded values — all config via environment variables
- [ ] Code is reviewed and merged via PR

---

## Success Metrics for MVP

| Metric | Target | Measurement |
|---|---|---|
| User Registration | Working | Can create an account and log in |
| Resource Upload | Working | Can upload a PDF and view it |
| PDF Annotation | Working | Can highlight and bookmark |
| AI Chat | Working | Can ask a question and receive an answer |
| First Sale | Working | Can list a resource, purchase it, and access it |
| Page Load | < 2s | Measured on Vercel production |
| API Response | < 300ms | P95 on Railway production |

---

## Decisions That Are Final

1. We build **web-first**. No React Native, no Flutter, no PWA in MVP.
2. We use **Razorpay** for payments (India-first, easy test mode, no revenue share).
3. We use **Supabase Storage** for file storage in MVP (not AWS S3).
4. AI responses are powered by **Google Gemini** (cost-effective, generous free tier).
5. We support **PDF files only** in MVP. No DOCX, no PPT, no EPUB.
6. The AI context window is **per-document**. Cross-document queries are Phase 2.
