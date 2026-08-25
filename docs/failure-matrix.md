# Failure Recovery Matrix

This matrix documents expected system responses, user impact, retry policies, and recovery actions across failure scenarios.

---

## Failure Recovery Matrix

| System Component | Specific Failure Event | User Impact | Server Response | Auto-Retry? | Fallback Mechanism | Recovery Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | Database connection timeout or crash. | Data operations unavailable. | `503 Service Unavailable` | No | Frontend displays "Database temporarily unavailable. Retrying..." | Database connection pool auto-reconnects on DB recovery. |
| **PostgreSQL** | Unique constraint violation (duplicate key). | Request rejected. | `409 Conflict` | No | Shows "Resource already exists" message. | User provides unique resource name or identifier. |
| **LLM Provider** | API timeout or 500 error during RAG chat. | AI tutor response stalls. | `503 Service Unavailable` | Yes (max 2 retries, exponential backoff) | Conversation history remains intact; displays retry button. | User clicks "Retry Question". Core academic data untouched. |
| **LLM Provider** | 429 Rate Limit error from provider. | AI chat rate limited. | `429 Too Many Requests` | No | Returns rate limit notification with time header. | System respects provider backoff window before allowing prompt. |
| **Embedding Model**| Service failure during PDF ingestion. | Document ingestion fails. | `500 Internal Error` | No | `RagDocument` status set to `FAILED` with explicit error string. | User clicks "Retry Ingestion" on document attachment widget. |
| **PDF Extractor** | Password-protected or malformed PDF upload. | File text unextractable. | `400 Bad Request` | No | Displays "Unable to extract text from document format". | User uploads unlocked PDF or text file. |
| **pgvector** | HNSW index query failure. | Vector search error. | `503 Service Unavailable` | No | Returns non-grounded general explanation warning. | Vector query falls back gracefully to standard keyword search. |
| **SSE Connection** | Network disconnect during AI streaming response. | Text stream stops. | Client disconnect logged. | No | Emitter closed; partial response preserved in chat UI. | Client reconnects or submits prompt again. |
| **Front-End UI** | User double-clicks "Submit Assessment". | Potential duplicate POST. | `200 OK` (Idempotent response) | No | Idempotency check returns existing attempt result without duplicate score. | None required; system enforces idempotency. |
| **Front-End UI** | User refreshes browser during "Complete Session".| Potential duplicate POST. | `200 OK` (Idempotent response) | No | Idempotency check returns completed session without duplicate time increment. | None required; system enforces idempotency. |
