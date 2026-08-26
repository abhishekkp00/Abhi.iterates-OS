# System Feature Status & Architecture Scope — AbhiIterates.OS

This document defines the implemented features, subsystem boundaries, and technical architecture of **Abhi.iterates-OS**.

---

## Implemented Core Subsystems

### 1. Authentication & Security Domain
- **Authentication**: JWT access tokens (15-min) with refresh token rotation (7 days) stored in PostgreSQL (`user_sessions`).
- **Authorization**: Role-Based Access Control (`ROLE_STUDENT`, `ROLE_CREATOR`, `ROLE_ADMIN`).
- **Security Hardening**: Service-level IDOR user-isolation (`WHERE user_id = :userId`), IP-based sliding window rate limiting (`RateLimiterService`), malicious extension file blacklist, and RAG prompt injection boundary tags (`<academic_context>`).

### 2. Academic Domain & Prerequisites Graph
- **Academic Subjects & Topics**: Subject grouping with color tokens, code IDs, and topic hierarchy (`Subject.java`, `Topic.java`).
- **Prerequisites Graph**: Direct Acyclic Graph (DAG) for topic dependencies (`TopicPrerequisite.java`) evaluated deterministically.
- **Academic Goals & Target Exams**: Academic goal setting (`AcademicGoal.java`) and target exam tracking (`Exam.java`, `ExamTopic.java`).

### 3. Study Sessions & Longitudinal Analytics
- **Study Sessions**: Active study tracking (`StudySession.java`) linked to topics, duration, and study status (`COMPLETED`, `PAUSED`, `ABANDONED`).
- **Topic Progress**: Factual metrics for study count, total study minutes, and completion confidence (`TopicProgress.java`).
- **Longitudinal Learning Analytics**: Bulk SQL query evaluation of mastery states (`STRONG`, `DEVELOPING`, `WEAK`, `INSUFFICIENT_DATA`), learning trends (`IMPROVING`, `STABLE`, `DECLINING`), and evidence levels (`HIGH`, `MEDIUM`, `LOW`).

### 4. Assessment Engine
- **Quiz Generation & Execution**: Automated topic-scoped assessment blueprint generation (`Assessment.java`, `Question.java`).
- **Attempt Tracking & Scoring**: Real-time option evaluation, attempt logging (`AssessmentAttempt.java`), and student answer recording (`AssessmentAnswer.java`).
- **Topic Assessment Performance**: Historical accuracy metrics and longitudinal performance tracking (`TopicAssessmentPerformance.java`).

### 5. Grounded RAG AI Engine
- **Document Ingestion & Chunking**: PDF page extraction (`PdfExtractorService`), SHA-256 hash validation, and overlapping semantic window chunking (`DocumentChunker`).
- **Vector Storage**: PostgreSQL `pgvector` (`rag_document_chunk_embeddings`) with HNSW cosine similarity indexing (`idx_rag_emb_vector_hnsw`).
- **Multi-Tiered Vector Search**: Topic-scoped, subject-scoped, and user-wide vector search with strict user-id isolation (`WHERE r.user_id = :userId`).
- **SSE Streaming & Citations**: Real-time Server-Sent Events (`text/event-stream`) streaming with markdown source citations containing page numbers and similarity scores.

### 6. Deterministic Adaptive Study Planner
- **Exam Phase Engine**: Proximity-driven exam phase resolution (`LEARNING`, `PRACTICE`, `CONSOLIDATION`, `REVISION`, `FINAL_REVIEW`).
- **Priority Engine**: Non-linear multi-factor topic priority scoring (Mastery, Exam weight, Prerequisite depth, Recency).
- **Time Allocator**: Daily available study minutes allocation based on priority weights.

---

## Technical Stack & Infrastructure Decisions

| Layer | Component | Technology |
|---|---|---|
| **Frontend** | React 18 SPA | TypeScript 5, Vite 5, Tailwind CSS, TanStack Query, Lucide Icons |
| **Backend** | Spring Boot 3.3 | Java 21 JRE, Spring AI, Spring Security, Flyway |
| **Database** | PostgreSQL 16 | Native `pgvector` extension (`pgvector/pgvector:pg16`) |
| **Rate Limiting** | In-Process Bucket4j | Sliding window in-memory rate limiting (`RateLimiterService`) |
| **File Storage** | Local Disk / Cloud | Mounted persistent volume (`/app/uploads`) / Cloudinary |
| **Containerization**| Docker & Nginx | Multi-stage Dockerfiles, Nginx SPA proxy with `proxy_buffering off` for SSE |
