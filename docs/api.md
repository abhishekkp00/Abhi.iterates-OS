# REST API Reference & Specification

This document provides a comprehensive inventory of all active REST API endpoints in **Abhi.iterates-OS**.

---

## Global API Conventions

### Base URL & Versioning
- **Base Endpoint**: `/api/v1`
- **Protocol**: HTTP / HTTPS

### Authentication & Authorization
- **Type**: Bearer Token (JWT).
- **Header**: `Authorization: Bearer <token>`
- **User Scoping**: All operations auto-scoped to the authenticated user ID extracted from JWT SecurityContext.

### Standard Error Response Format
```json
{
  "timestamp": "2026-08-26T01:45:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Resource not found with ID: 7aeaabbd-eb97-40c6-ba6b-c7fee8b774b9",
  "path": "/api/v1/resources/7aeaabbd-eb97-40c6-ba6b-c7fee8b774b9"
}
```

---

## Endpoint Inventory by Domain

### 1. Authentication & Security (`/api/v1/auth`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new student account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and issue JWT token pair |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired JWT access token |
| `POST` | `/api/v1/auth/logout` | Required | Revoke active user session |
| `GET` | `/api/v1/auth/me` | Required | Retrieve current authenticated user profile |

---

### 2. Academic Subjects & Topics (`/api/v1/academic`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/academic/dashboard` | Required | Fetch Academic Command Center aggregated dashboard data |
| `GET` | `/api/v1/academic/subjects` | Required | List all subjects created by the authenticated user |
| `POST` | `/api/v1/academic/subjects` | Required | Create a new academic subject |
| `PUT` | `/api/v1/academic/subjects/{id}` | Required | Update subject details |
| `DELETE` | `/api/v1/academic/subjects/{id}` | Required | Delete subject and associated topics |
| `GET` | `/api/v1/academic/topics` | Required | List all academic topics (optional `subjectId` filter) |
| `POST` | `/api/v1/academic/topics` | Required | Create a new topic under a subject |
| `GET` | `/api/v1/academic/topics/{id}/learning-state` | Required | Fetch current mastery state and trend for a topic |
| `POST` | `/api/v1/academic/topics/prerequisites` | Required | Define DAG prerequisite link between two topics |

---

### 3. Exam Management (`/api/v1/academic/exams`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/academic/exams` | Required | List all registered upcoming and past exams |
| `POST` | `/api/v1/academic/exams` | Required | Create a new exam with linked topics and target date |
| `GET` | `/api/v1/academic/exams/{id}` | Required | Fetch exam details and topic weight distribution |
| `GET` | `/api/v1/academic/exams/{id}/coverage` | Required | Get factual study and assessment coverage metrics for exam |
| `GET` | `/api/v1/academic/exams/{id}/phase` | Required | Calculate active `ExamStudyPhase` based on days remaining |
| `DELETE` | `/api/v1/academic/exams/{id}` | Required | Delete exam entry |

---

### 4. Study Sessions (`/api/v1/study-sessions`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/study-sessions/start` | Required | Start a active timed study session for a topic |
| `POST` | `/api/v1/study-sessions/{id}/complete` | Required | Complete study session and record actual duration |
| `POST` | `/api/v1/study-sessions/manual` | Required | Log a completed past study session manually |
| `GET` | `/api/v1/study-sessions/active` | Required | Fetch active ongoing study session if one exists |
| `GET` | `/api/v1/study-sessions` | Required | List paginated study session logs |
| `GET` | `/api/v1/study-sessions/topics/{topicId}/progress` | Required | Fetch total minutes studied and session metrics for a topic |

---

### 5. Adaptive Study Planner (`/api/v1/study-planner`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/study-planner/generate` | Required | Trigger deterministic algorithm to generate a study plan |
| `GET` | `/api/v1/study-planner/current` | Required | Retrieve current active study plan and planned sessions |
| `POST` | `/api/v1/study-planner/sessions/{id}/complete` | Required | Mark a planned study session as completed |

---

### 6. Assessment Engine (`/api/v1/assessments`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/assessments/generate-adaptive` | Required | Trigger LLM to generate an assessment for a topic |
| `GET` | `/api/v1/assessments` | Required | List all generated assessments |
| `GET` | `/api/v1/assessments/{id}` | Required | Fetch assessment details and questions |
| `POST` | `/api/v1/assessment-attempts/assessments/{id}/start` | Required | Begin an assessment attempt |
| `POST` | `/api/v1/assessment-attempts/{id}/submit` | Required | Submit answers, score attempt, and update learning state |
| `GET` | `/api/v1/assessments/topics/{topicId}/performance` | Required | Fetch historical accuracy and question difficulty stats for topic |

---

### 7. AI Tutor & RAG Chat (`/api/v1/ai`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/conversations` | Required | List all AI chat conversations |
| `POST` | `/api/v1/ai/conversations` | Required | Create a new AI chat conversation |
| `GET` | `/api/v1/ai/chat/stream` | Required | Server-Sent Events (SSE) endpoint for grounded RAG streaming chat |

---

### 8. Resource & Document Ingestion (`/api/v1/resources`)

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/resources` | Required | List student resources (documents, links, notes) |
| `POST` | `/api/v1/resources` | Required | Upload resource file or note |
| `POST` | `/api/v1/resources/{id}/ingest` | Required | Extract PDF text, chunk document, and store vector embeddings |
