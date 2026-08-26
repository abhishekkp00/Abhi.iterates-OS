# Abhi.iterates-OS Threat Model

This document outlines the threat modeling methodology, asset inventory, trust boundaries, threat scenarios, and mitigation controls for **Abhi.iterates-OS**.

---

## 1. Asset Inventory

| Asset Name | Sensitivity Level | Impact of Compromise | Location / Storage |
|------------|-------------------|----------------------|--------------------|
| User Credentials & Password Hashes | **CRITICAL** | Account takeover, identity theft | PostgreSQL `users.password` (BCrypt hashed) |
| JWT Signing Secrets & Private Keys | **CRITICAL** | System-wide token forgery | Environment variable `JWT_SECRET` |
| AI / LLM Provider API Keys | **CRITICAL** | Cost abuse, key theft | Environment variable `SPRING_AI_OPENAI_API_KEY` |
| Refresh Tokens | **HIGH** | Persistent unauthorized session access | PostgreSQL `refresh_tokens` (hashed/UUID token ID) |
| Student Academic Data & Performance Scores | **HIGH** | Privacy violation, unauthorized data disclosure | PostgreSQL `topic_progress`, `topic_assessment_performance` |
| Uploaded Documents & Textbooks | **HIGH** | Intellectual property & private notes exposure | Local `./uploads/` / Cloudinary & pgvector |
| Vector Embeddings | **MEDIUM** | Information leakage via reconstruction | PostgreSQL `rag_document_chunk_embeddings` |
| Application Source Code & System Config | **MEDIUM** | Attack vector discovery | GitHub Repository / Deployment Host |

---

## 2. Actors & System Boundaries

```
[ UNTRUSTED ]                                  [ TRUSTED BACKEND BOUNDARY ]
  Student / Anonymous User (Browser) ──(HTTPS)──> Spring Boot REST API
  Malicious Authenticated User        ──(JWT)───> Security Context / Ownership Check
  Hostile PDF / Document Content      ──(Parser)─> Isolated `<academic_context>` XML Prompt
  
                                               [ EXTERNAL SERVICES ]
                                              ─(HTTPS)─> OpenAI / Groq API (LLM)
                                              ─(JDBC)──> PostgreSQL + pgvector
```

### Actors
1. **Anonymous Public User**: Unauthenticated visitor. Can register or log in.
2. **Authenticated Student**: Normal user logged in with JWT bearer credentials.
3. **Malicious Authenticated Student**: User attempting IDOR, parameter tampering, or resource theft from other students.
4. **Hostile Uploaded Document**: PDF/Text file containing prompt injection vectors ("Ignore instructions...").
5. **External AI Provider**: Third-party LLM (OpenAI/Groq). Treated as untrusted for security decisions.
6. **PostgreSQL Database**: Primary relational data store and vector database.

---

## 3. Trust Boundaries & Security Rules

1. **Browser → API Boundary**:
   - Untrusted transport. Enforced via HTTPS, JWT signature validation, CORS origin checking, and input DTO validation.
2. **API → Database Boundary**:
   - Enforced via Spring Security principal context, parameterized JPQL / native SQL queries, and IDOR ownership filtering (`user_id = :authUserId`).
3. **User Document → RAG Prompt Boundary**:
   - Retrieved chunks are treated as **untrusted data**. Enforced by wrapping chunks inside `<academic_context>` XML tags with explicit system instructions prohibiting execution of commands inside context.
4. **LLM Output → Application Boundary**:
   - LLM responses are untrusted text. Authorization decisions are strictly application-side. LLMs are never permitted to modify user permissions, database state, or ownership.

---

## 4. Threat Matrix & Defensive Mitigations

| Threat ID | Threat Description | Attack Vector | Mitigation Control | Residual Risk |
|-----------|--------------------|---------------+--------------------+---------------|
| **T-01** | Insecure Direct Object Reference (IDOR) | Attacker alters UUID in URL/request body to access another student's exam, resource, or study plan. | Service-level ownership checks + SQL `WHERE user_id = :authUserId`. Verified by `IdorSecurityIntegrationTest.java`. | LOW: Relies on correct service-layer query scoping. |
| **T-02** | RAG Document Prompt Injection | Uploaded PDF contains text attempting to override tutor instructions or reveal system prompt. | Retrieved text wrapped in `<academic_context>` XML tags with explicit system instructions prohibiting command execution. | LOW: LLMs are non-deterministic; system instructions minimize but do not 100% eliminate risk. |
| **T-03** | Brute-force Login / Credential Stuffing | Automated script submits thousands of passwords against `/login`. | IP-based sliding-window rate limiting (`RateLimiterService`) throwing HTTP 429. | LOW: Distributed botnet could bypass single-IP throttling. |
| **T-04** | Malicious File Upload / Path Traversal | Attacker uploads `../../etc/passwd` or webshell (`.jsp`, `.exe`). | Filename sanitization (`StringUtils.cleanPath`), path traversal checks, and extension blacklist (`.exe`, `.jsp`, `.sh`, `.php`). | LOW: Local disk storage used if Cloudinary not configured; uploads dir non-executable. |
| **T-05** | Mass Assignment / Privilege Escalation | Attacker injects `"roles": ["ROLE_ADMIN"]` into JSON registration payload. | Strict DTO separation (`RegisterRequest` contains only user-editable fields; roles assigned programmatically). | NONE: DTOs do not bind entity role collections. |
| **T-06** | Vector Retrieval Cross-User Data Leakage | Attacker query retrieves vector chunk belonging to another user. | Native SQL in `VectorSearchRepositoryImpl` explicitly includes `WHERE r.user_id = :userId`. Verified by `CrossUserRagSecurityTest.java`. | NONE: Database query enforces user filter before vector comparison. |
| **T-07** | Hardcoded Credentials / Secrets Leakage | API key or JWT secret committed to repository. | All secrets externalized via environment variables (`${JWT_SECRET}`, `${SPRING_AI_OPENAI_API_KEY}`). | LOW: Secrets must be securely injected in CI/CD runtime. |
