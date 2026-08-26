# Application Security Test Matrix

This matrix maps security attack vectors against target endpoints, expected security responses, actual test verification, and current status.

| Attack Vector | Target Endpoint | Expected Behavior | Actual Behavior | Test File / Verification | Status |
|---------------|-----------------|-------------------|-----------------|--------------------------|--------|
| **IDOR Access** | `DELETE /api/v1/academic/exams/{id}` | HTTP 404 or 403 Forbidden | HTTP 404 / 403 returned | `IdorSecurityIntegrationTest.java` | **PASS** |
| **IDOR Access** | `GET /api/v1/study-plans/{id}` | HTTP 404 or 403 Forbidden | HTTP 404 / 403 returned | `IdorSecurityIntegrationTest.java` | **PASS** |
| **IDOR Access** | `DELETE /api/v1/academic/goals/{id}` | HTTP 404 or 403 Forbidden | HTTP 404 / 403 returned | `IdorSecurityIntegrationTest.java` | **PASS** |
| **IDOR Access** | `GET /api/v1/assessments/{id}` | HTTP 404 or 403 Forbidden | HTTP 404 / 403 returned | `IdorSecurityIntegrationTest.java` | **PASS** |
| **IDOR Access** | `GET /api/v1/resources/{id}` | HTTP 404 or 403 Forbidden | HTTP 404 / 403 returned | `IdorSecurityIntegrationTest.java` | **PASS** |
| **Cross-User RAG Leak** | `POST /api/v1/ai/chat` | Zero chunks retrieved from User A's private documents | 0 chunks returned for User B | `CrossUserRagSecurityTest.java` | **PASS** |
| **Vector Search Isolation** | `VectorSearchRepositoryImpl` | SQL query filters `r.user_id = :userId` | Enforced at SQL layer | `CrossUserRagSecurityTest.java` | **PASS** |
| **Prompt Injection** | `POST /api/v1/ai/chat` | RAG context wrapped in `<academic_context>` with non-execution notice | Security notice tags injected | `PromptInjectionSecurityTest.java` | **PASS** |
| **Path Traversal Upload** | `POST /api/v1/resources/{id}/attachments` | Filename `../../etc/passwd` rejected | HTTP 400 IllegalArgumentException | `FileUploadSecurityTest.java` | **PASS** |
| **Executable Upload** | `POST /api/v1/resources/{id}/attachments` | File `malware.exe` rejected | HTTP 400 IllegalArgumentException | `FileUploadSecurityTest.java` | **PASS** |
| **JSP Script Upload** | `POST /api/v1/resources/{id}/attachments` | File `webshell.jsp` rejected | HTTP 400 IllegalArgumentException | `FileUploadSecurityTest.java` | **PASS** |
| **Brute-Force Throttling** | `POST /api/v1/auth/login` | Exceeding 10 req/min per IP returns HTTP 429 | RateLimitExceededException (429) | `AuthController.java` + `RateLimiterService` | **PASS** |
| **Mass Assignment** | `POST /api/v1/auth/register` | `"roles": ["ROLE_ADMIN"]` ignored in payload | Programmatically set to student role | `RegisterRequest.java` validation | **PASS** |
| **Password Hashing** | `POST /api/v1/auth/register` | Password stored as BCrypt hash (factor 10) | Hashed prior to DB insert | `AuthServiceImpl.java` | **PASS** |
| **JWT Validation** | `ALL /api/v1/**` | Invalid/expired signature rejected with HTTP 401 | HTTP 401 Unauthorized | `JwtAuthenticationFilter.java` | **PASS** |
