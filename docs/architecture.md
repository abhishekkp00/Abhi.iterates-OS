# System Architecture Inventory & Boundaries

## Architectural Overview

**Abhi.iterates-OS** is constructed as a **Spring Boot 3 Modular Monolith** coupled with a **React 18 + TypeScript SPA**. The architecture enforces strict domain boundaries, transactional consistency, and deterministic planning algorithms connected to a RAG-powered vector retrieval engine.

```
                      ┌─────────────────────────────────────────┐
                      │          React 18 SPA (Vite)            │
                      └────────────────────┬────────────────────┘
                                           │ HTTPS / SSE
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │     Spring Boot 3 API Gateway / REST    │
                      └────────────────────┬────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│ Academic Domain  │             │ Planning Engine  │             │ Assessment Engine│
│ - Subjects       │             │ - Exam Phase     │             │ - Blueprint Gen  │
│ - Topics & DAG   │             │ - Topic Priority │             │ - RAG Generation │
│ - Study Sessions │             │ - Time Alloc.    │             │ - Scoring & Perf │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          ▼
                               ┌──────────────────────┐
                               │  Spring Data JPA     │
                               └──────────┬───────────┘
                                          │ SQL
                                          ▼
                               ┌──────────────────────┐
                               │ PostgreSQL 16 DB     │
                               │ (relational data +   │
                               │  pgvector HNSW index)│
                               └──────────────────────┘
```

---

## Core Layers & Responsibilities

### 1. Presentation Layer (`frontend/src/`)
- **Technology**: React 18, TypeScript 5, Vite 6, TailwindCSS v4, Zustand, React Query.
- **Responsibilities**: User interaction, real-time SSE chat streaming, state management for active study sessions, interactive graphs, command center dashboard.
- **Key Modules**:
  - `features/academic`: Subject & Topic management, study session controls.
  - `features/planner`: Adaptive study plan display, planned session management.
  - `features/assessment`: Quiz execution, real-time option selection, result breakdown.
  - `features/ai`: SSE-based RAG chat streaming, source citations, document viewer.

### 2. Controller Layer (`backend/.../controller/`)
- **Technology**: Spring Web MVC, `@RestController`, `@PreAuthorize`, Spring Security.
- **Responsibilities**: HTTP request routing, JWT security context extraction, DTO mapping, input validation (`@Valid`), error handling via `@RestControllerAdvice`.
- **Enforcement**: Controllers **never** contain business logic or raw JPA entity handling. All return types are wrapped DTOs (`ApiResponse<T>` or direct DTOs).

### 3. Application / Service Layer (`backend/.../service/`)
- **Technology**: Spring `@Service`, `@Transactional`.
- **Responsibilities**: Transactional boundaries, entity orchestration, domain validation, event publishing, deterministic algorithm calculations.
- **Enforcement**: User data isolation (IDOR checks) is validated in services before mutating database state.

### 4. Domain & Engine Layer (`backend/.../engine/` & `domain/`)
- **Technology**: Pure Java domain entities, deterministic heuristic engines.
- **Engine Components**:
  - **`ExamPhaseEngine`**: Calculates `ExamStudyPhase` based on target exam proximity (`LEARNING`, `PRACTICE`, `CONSOLIDATION`, `REVISION`, `FINAL_REVIEW`).
  - **`TopicPriorityEngine`**: Calculates non-linear priority scores:
    $$\text{Priority} = w_m \cdot S_{\text{mastery}} + w_e \cdot S_{\text{exam}} + w_p \cdot S_{\text{prereq}} + w_r \cdot S_{\text{recency}}$$
  - **`LearningStateEngine`**: Evaluates longitudinal assessment attempt evidence into discrete state categories (`STRONG`, `DEVELOPING`, `WEAK`, `INSUFFICIENT_DATA`).

### 5. AI & Retrieval Augmented Generation (RAG) Layer (`backend/.../ai/`)
- **Technology**: Spring AI, PostgreSQL `pgvector`, OpenAI / Groq LLM API.
- **Responsibilities**: Document PDF extraction (Apache Tika), token-bounded chunking, vector embedding generation, HNSW cosine similarity search, RAG context assembly, and Server-Sent Event (SSE) streaming.

### 6. Persistence Layer (`backend/.../repository/`)
- **Technology**: Spring Data JPA, Hibernate 6, Flyway 10, PostgreSQL 16 + pgvector.
- **Responsibilities**: Transactional ORM mapping, HNSW vector search execution, custom `@Query` join fetches, cascading metadata cleanups.

---

## Subsystem Boundaries

| Subsystem | Primary Entities | Key Services | Main API Base |
| :--- | :--- | :--- | :--- |
| **Auth & Identity** | `User`, `UserSession`, `RefreshToken` | `AuthService`, `JwtTokenProvider` | `/api/v1/auth` |
| **Academic Domain** | `Subject`, `Topic`, `TopicPrerequisite`, `Exam` | `AcademicService`, `ExamService` | `/api/v1/academic` |
| **Study Sessions** | `StudySession`, `TopicProgress`, `LearningActivity` | `StudySessionService`, `LearningStateService` | `/api/v1/study-sessions` |
| **Adaptive Planning** | `StudyPlan`, `PlannedStudySession`, `PlannerPreference` | `StudyPlannerService`, `ExamPhaseEngine` | `/api/v1/study-planner` |
| **Assessment Engine** | `Assessment`, `Question`, `Attempt`, `Answer`, `Performance` | `AssessmentService`, `AiAssessmentGenerator` | `/api/v1/assessments` |
| **AI / RAG Engine** | `Document`, `DocumentChunk`, `ChunkEmbedding`, `Conversation` | `AiChatService`, `RagRetrievalService` | `/api/v1/ai` |
| **Resource Storage** | `Resource`, `ResourceAttachment` | `ResourceService` | `/api/v1/resources` |
| **Notifications** | `Notification` | `NotificationService` | `/api/v1/notifications` |

---

## Architectural Guarantees & Enforcements

1. **Modular Monolith Boundaries**: Domains interact strictly via Java service interfaces. No cross-domain raw SQL queries exist.
2. **User Data Isolation (IDOR Protection)**: Every query checks `userId == authenticatedUserId`. Attempting to access another user's resources returns `404 Not Found` or `403 Forbidden`.
3. **Deterministic Planning**: Study plan generation contains **zero LLM non-determinism**. Given identical academic state and preferences, the plan algorithm generates identical schedules.
4. **Strict RAG Grounding**: RAG prompts require explicit context grounding with markdown source citations.
