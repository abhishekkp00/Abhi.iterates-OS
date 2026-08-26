# System Reliability & Failure Resilience Inventory

This document details the failure-resilience pass for **Abhi.iterates-OS**, auditing system boundaries, failure modes, data consistency protections, and user recovery paths.

---

## 1. External System Boundaries & Failure Inventory

| Boundary Component | Failure Modes | Impact | Defensive Handling & Recovery |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Connection timeout, primary node down, query deadlock. | Data queries fail. | Returns `503 Service Unavailable` cleanly without exposing SQL traces; API endpoints fail safely; user sees recoverable notification. |
| **pgvector Engine** | Vector extension error, HNSW memory allocation fail. | Similarity search fails. | Falls back to keyword search or returns grounded failure notice without hallucinated citations. |
| **Third-Party LLM API** | Network timeout, 429 rate limit, 500 provider error. | RAG chat / Question generation fails. | Returns `503 Service Unavailable` with `traceId`; core academic database (subjects, sessions, topics) remains 100% intact. |
| **Embedding Provider** | Provider timeout, chunk embedding failure. | Document ingestion stalls. | Marks `RagDocument` status as `FAILED` with explicit error string; un-embedded chunks are deleted in rollback. |
| **Apache Tika Parser** | Malformed PDF, password-protected PDF, extraction OOM. | Document text extraction fails. | Catches `DocumentExtractionException`, logs error safely, sets document status to `FAILED`, and allows retry. |
| **Server-Sent Events (SSE)**| Client browser tab close, network drop during stream. | Stream interrupted mid-sentence. | Server registers `onCompletion`/`onTimeout`/`onError` callbacks, closes emitter cleanly, and avoids dangling memory leaks. |
| **User Front-End** | Rapid double-clicking, browser refresh mid-submit. | Duplicate POST request payload. | Idempotency checks on Assessment Submit (`SUBMITTED` state check) and Study Session Complete (`COMPLETED` state check) prevent duplicate records. |

---

## 2. Global Error Model & Standardization

All backend exceptions are intercepted by `@RestControllerAdvice` (`GlobalExceptionHandler.java`) and mapped to a uniform JSON envelope:

```json
{
  "success": false,
  "message": "Resource not found with ID: 7aeaabbd-eb97-40c6-ba6b-c7fee8b774b9",
  "data": null,
  "timestamp": "2026-08-26T02:00:00Z",
  "path": "/api/v1/academic/topics/7aeaabbd-eb97-40c6-ba6b-c7fee8b774b9",
  "status": 404,
  "traceId": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c"
}
```

### Standard Error Code Taxonomy
- `400 BAD_REQUEST`: Validation constraint failures (`MethodArgumentNotValidException`, `IllegalArgumentException`).
- `401 UNAUTHORIZED`: Unauthenticated session or invalid JWT signature (`BadCredentialsException`).
- `403 FORBIDDEN`: Access denied / cross-user ownership violation (`AccessDeniedException`, `UnauthorizedException`).
- `404 NOT_FOUND`: Resource missing or user isolation check fail (`ResourceNotFoundException`).
- `409 CONFLICT`: Duplicate constraint violation or concurrent modification (`DataIntegrityViolationException`, `OptimisticLockingFailureException`).
- `413 PAYLOAD_TOO_LARGE`: Uploaded file exceeds 20MB limit (`MaxUploadSizeExceededException`).
- `429 TOO_MANY_REQUESTS`: Rate limit threshold exceeded on AI/ingestion endpoints (`RateLimitExceededException`).
- `503 SERVICE_UNAVAILABLE`: Database connection failure or transient service timeout (`CannotCreateTransactionException`).

---

## 3. Correlation ID & Structured MDC Logging

Every incoming HTTP request passes through `RequestIdFilter.java` (`Ordered.HIGHEST_PRECEDENCE`):
1. Reads `X-Request-ID` header if present (sanitizing alphanumeric characters); generates UUIDv4 if missing.
2. Sets `X-Request-ID` HTTP response header.
3. Binds `requestId` to SLF4J `MDC` context.
4. Auto-populates `traceId` in `ApiResponse` payload.

**Log Security Rule**: Passwords, raw JWT tokens, API keys, and full document content are **never** logged.

---

## 4. Idempotency & Transactional Atomicity Controls

1. **Assessment Attempt Submission**:
   - `AssessmentAttemptServiceImpl.submitAttempt` checks `attempt.getStatus() == AttemptStatus.SUBMITTED`.
   - Re-submitting an already evaluated attempt returns stored results without re-calculating scores or creating duplicate `AssessmentAnswer` records.
2. **Study Session Completion**:
   - `StudySessionServiceImpl.completeSession` checks `session.getStatus() == StudySessionStatus.COMPLETED`.
   - Repeated requests return completed session details without re-incrementing total studied minutes on `TopicProgress`.
3. **Atomic Plan Replacement**:
   - `StudyPlannerServiceImpl.activatePlan` runs inside `@Transactional`. Expiring previous active plan and setting new plan status to `ACTIVE` occur atomically.
