# User Journeys — AbhiIterates.OS

Four complete journeys covering every major user type.

---

## Journey 1 — New Student (First Time Experience)

**Persona:** Arjun Mehta, 3rd year B.Tech
**Goal:** Organize semester notes and read a PDF with AI assistance
**Entry Point:** Sees a friend using the platform / finds it via search

```
DISCOVERY
  Hears about AbhiIterates.OS from a classmate
  Visits landing page on phone browser
  Reads hero section: "Your academic workspace. All in one place."
  Sees PDF viewer demo and AI chat demo in landing
  Clicks "Get Started Free"
        ↓
REGISTRATION
  Sees split registration screen
  Chooses "Continue with Google" (faster path)
  Google OAuth popup → selects college Gmail account
  Redirected to onboarding flow
        ↓
ONBOARDING (first-time only, 3 steps)
  Step 1: "What are you studying?"
    → Selects: Engineering → Computer Science
  Step 2: "Create your first semester"
    → Types: "Semester 5"
    → System creates semester with suggested subjects (CSE Sem 5)
    → He selects: DBMS, OS, Computer Networks, and adds custom: "Mini Project"
  Step 3: "Upload your first resource"
    → Drags and drops DBMS_Unit1.pdf
    → Upload progress bar completes
    → "You're ready! Open your PDF." CTA appears
        ↓
DASHBOARD (first view)
  Sees dashboard with:
    - "Continue Reading: DBMS_Unit1.pdf" (from onboarding upload)
    - Empty state for AI Chats: "Chat with your first PDF →"
    - Empty state for Bookmarks
    - Study Stats: 0 hours this week
  Clicks "Continue Reading"
        ↓
PDF WORKSPACE (first time)
  PDF opens in full reading view
  First-time tooltip appears: "Highlight text to save key points"
  He reads first page, selects a paragraph about normalization
  Yellow highlight appears → auto-saved toast: "Highlight saved ✓"
  Tooltip: "Now try asking AI about what you just highlighted"
  Clicks AI icon in toolbar → AI panel slides in from right
  Suggested prompt appears: "Summarize this chapter"
  He clicks it → AI generates summary with page citations
  He types: "Explain 2NF with an example"
  AI responds with formatted explanation and cites "Page 12"
        ↓
BOOKMARK
  Scrolls to page where key formula appears
  Clicks bookmark icon in page margin
  Bookmark saved → appears in left sidebar bookmark list
  Clicks bookmark → jumps back to that page
        ↓
RETURN TO LIBRARY
  Clicks breadcrumb: "DBMS" to return to subject
  Sees DBMS_Unit1.pdf with highlight count badge: "4 highlights"
  Uploads DBMS_Unit2.pdf (drag and drop on subject page)
        ↓
SESSION END
  Closes browser
  Returns next day → lands on dashboard
  "Continue Reading" shows DBMS_Unit2.pdf, page 1
  Highlight badge shows 4 saved highlights
  AI chat history shows yesterday's conversation
```

**Key UX Insights from this journey:**
- Onboarding must complete in under 2 minutes
- PDF workspace must feel familiar immediately (GoodNotes-like)
- First AI interaction must feel magical — use a suggested prompt to ensure success
- Progress persistence builds habit and loyalty

---

## Journey 2 — Returning Student (Daily Study Session)

**Persona:** Sneha Iyer, 3rd year MBBS
**Goal:** Continue reading Anatomy chapter, annotate, generate MCQs
**Entry Point:** Direct navigation, already logged in

```
MORNING SESSION
  Opens browser, navigates to abhiiterates.com
  Already logged in → lands on Dashboard
  Sees: "Continue Reading: Gray's Anatomy Ch.14 — Page 47"
  Clicks → PDF opens exactly at page 47
        ↓
PDF WORKSPACE (deep session)
  Reading mode: clean, no UI clutter
  Scrolls through pages, selects text about brachial plexus
  Opens color picker → selects blue (her convention for anatomy terms)
  Highlights entire paragraph
  Adds annotation note: "Remember: 5 roots C5-T1"
  Continues reading, adds 6 more highlights over 45 minutes
        ↓
QUICK REFERENCE
  Needs to check something from Chapter 12
  Opens bookmark sidebar
  Sees: "Ch.12 — Shoulder Joint diagram" (bookmarked last week)
  Clicks → jumps to page 31
  References the diagram, returns to Chapter 14 via breadcrumb history
        ↓
AI SESSION
  Opens AI panel
  Types: "What are the branches of the brachial plexus and their functions?"
  AI responds with structured table citing pages 47-49
  She types: "Generate 5 MCQs from pages 45-50 for my exam revision"
  AI generates MCQs with correct answers and explanations
  She copies the MCQs to a new text note on that page
        ↓
HIGHLIGHT REVIEW
  Opens highlights sidebar
  Sees all 7 highlights from today in order
  Clicks one → PDF jumps to that page
  Uses highlights to create a quick mental summary
        ↓
EXIT
  Closes AI panel
  Dashboard updates: "3 hours studied today"
  Study streak increments: "14-day streak 🔥"
```

---

## Journey 3 — Creator (Publishing Notes)

**Persona:** Priya Nair, UPSC notes seller
**Goal:** Upload a new note set, set price, publish to marketplace

```
CREATOR DASHBOARD
  Logs in → directed to /creator/dashboard
  Sees: ₹12,400 earned this month, 47 sales, 3 resources live
  Clicks "Upload New Resource"
        ↓
RESOURCE UPLOAD FLOW
  Step 1: Basic Info
    → Title: "UPSC Polity — Complete Notes 2024"
    → Description: (rich text editor) writes what's covered
    → Subject Category: UPSC → Polity
    → Tags: polity, constitution, UPSC 2025
  Step 2: Upload File
    → Drags PDF (380 pages)
    → Upload progress: "Uploading... 67%"
    → "Processing PDF for preview generation..."
    → Preview thumbnails generated: first 5 pages shown
  Step 3: Pricing
    → Price: ₹299
    → Free preview pages: 10 (she selects first 10 pages)
    → "Students will see pages 1-10 before buying"
  Step 4: Review and Publish
    → Sees full listing preview: how it appears to students
    → Clicks "Submit for Review"
        ↓
ADMIN REVIEW (async)
  Admin receives notification: "New resource pending review"
  Admin reviews content quality, checks for copyright issues
  Approves → Priya receives notification: "Your resource is live!"
        ↓
LISTING LIVE
  Resource appears in /marketplace/category/upsc
  Student visits → sees preview pages 1-10
  Student purchases → receives access
  Priya receives notification: "New sale! ₹254 (after platform fee)"
        ↓
ANALYTICS
  Next day: views /creator/analytics
  Sees: resource has 143 views, 12 purchases, 8.4% conversion rate
  Compares to previous resource: 230 views, 6% conversion
  Decides to add more detail to description to improve conversion
```

---

## Journey 4 — Admin (Content Moderation)

**Persona:** Platform admin
**Goal:** Review pending resources, manage a reported listing

```
ADMIN DASHBOARD
  Logs in → /admin/dashboard
  Sees: 3 resources pending review, 1 user report, 847 active users today
        ↓
RESOURCE REVIEW
  Clicks "3 Pending Resources"
  → /admin/resources (filtered to pending)
  Opens first resource: "UPSC Polity Notes"
    → Sees resource metadata, file size, creator profile
    → Opens PDF preview inline
    → Checks: content quality, originality, appropriate pricing
    → No issues found → Clicks "Approve"
    → Creator notified automatically
  Opens second resource: "Engineering Maths Handwritten"
    → Reviews first 20 pages
    → Finds the content appears to be scanned from a published textbook
    → Clicks "Reject" → Types reason: "Content appears to be copyrighted material"
    → Creator notified with reason
        ↓
USER REPORT
  Clicks reported listing: "Free GATE Notes"
  Sees report reason: "This PDF is from Made Easy books — copyright violation"
  Admin reviews → confirms copyright issue
  Clicks "Remove Listing" + "Warn Creator"
  Creator receives warning email, listing removed
        ↓
ANALYTICS REVIEW
  /admin/reports → sees this week's metrics
  New users: 234, Resources uploaded: 67, Revenue: ₹18,400
  Identifies spike in UPSC category → flags for featured placement
```

---

## Use Cases

### UC-001: User Registration

**Actor:** Unauthenticated visitor
**Preconditions:** User is not logged in, has a valid email address
**Main Flow:**
1. User navigates to `/register`
2. User enters: full name, email, password (8+ chars)
3. System validates inputs (format, strength, uniqueness)
4. System creates user account with role: USER
5. System sends welcome email
6. System issues JWT access token + refresh token
7. System redirects to onboarding flow
**Alternate Flow A — Email already exists:**
3a. System detects duplicate email
3b. Returns error: "An account with this email already exists. Sign in instead."
**Alternate Flow B — Google OAuth:**
2a. User clicks "Continue with Google"
2b. Google OAuth popup, user selects account
2c. System receives Google ID token, verifies it
2d. System creates account (if new) or logs in (if existing)
2e. Redirect to dashboard / onboarding
**Post Conditions:** User has an authenticated session. Refresh token stored in database.

---

### UC-002: PDF Reading with Highlights

**Actor:** Authenticated student
**Preconditions:** User is logged in, has at least one PDF uploaded
**Main Flow:**
1. User navigates to a PDF resource
2. System fetches signed URL from Supabase (5 min expiry)
3. PDF loads in PDF.js viewer
4. User selects text on any page
5. Highlight color picker appears (Yellow, Green, Blue, Pink)
6. User selects a color
7. System renders highlight overlay on selected text
8. System saves highlight to database: {userId, resourceId, pageNumber, position, color, text}
9. Toast: "Highlight saved"
10. Highlight appears in sidebar highlight list
**Alternate Flow — Annotation:**
6a. User clicks "Add Note" option
6b. Text input appears, user types note
6c. Note indicator (sticky note icon) appears in page margin
6d. Note saved to database linked to the highlight
**Alternate Flow — Delete Highlight:**
User right-clicks an existing highlight → context menu → "Remove Highlight"
System deletes from database. Highlight removed from view instantly.
**Post Conditions:** Highlights persist across sessions. Visible every time the PDF is opened.

---

### UC-003: AI Chat with PDF

**Actor:** Authenticated student
**Preconditions:** User has a PDF open, AI service is available
**Main Flow:**
1. User opens AI panel (toolbar button or keyboard shortcut)
2. System creates a new conversation linked to this resource
3. System initiates RAG pipeline: checks if PDF is vectorized
   3a. If not vectorized: "Preparing your document for AI..." (one-time, 10-30 seconds)
   3b. If vectorized: panel ready immediately
4. Suggested prompts appear: "Summarize this chapter", "Explain key concepts", "Generate MCQs"
5. User types or selects a prompt
6. System sends: {question, resourceId, conversationId} to AI service
7. AI service retrieves relevant chunks via FAISS similarity search
8. AI service constructs prompt with context chunks + user question
9. AI generates response (streaming)
10. Response renders word by word with page citations
11. User can continue the conversation
**Alternate Flow — AI Service Unavailable:**
8a. AI service returns error
8b. Frontend shows: "AI is temporarily unavailable. Please try again in a few minutes." with retry button
**Alternate Flow — Question out of document scope:**
AI responds: "I couldn't find this in your document. Here is what I know generally: [answer]. Note: this is not based on your PDF."
**Post Conditions:** Conversation saved to database. Accessible from AI history. Citations link to specific PDF pages.

---

### UC-004: Marketplace Purchase

**Actor:** Authenticated student
**Preconditions:** User is logged in, has valid payment method
**Main Flow:**
1. User browses marketplace, finds a resource
2. User clicks resource → product detail page
3. User reads description, sees first N preview pages in embedded viewer
4. User clicks "Purchase for ₹299"
5. Checkout page loads: shows resource name, price, platform fee, total
6. User selects payment method: UPI / Card / Net Banking (via Razorpay)
7. Razorpay payment modal opens
8. User completes payment
9. Razorpay sends webhook to backend: payment_success
10. Backend creates Purchase record, grants resource access
11. Backend sends purchase confirmation email
12. User redirected to: "Purchase Complete! Open in Library →"
**Alternate Flow — Payment Failure:**
8a. Payment fails (insufficient funds / declined)
8b. Razorpay returns failure event
8c. Frontend shows: "Payment failed. No amount was deducted. Try again."
8d. User can retry or choose different payment method
**Alternate Flow — Already Purchased:**
4a. System detects user has already purchased this resource
4b. Button shows "Open in Library" instead of "Purchase"
**Post Conditions:** Purchase record exists in database. User has permanent access to the resource. Resource appears in user's library under "Purchases".
