# Technical Interview Defense Guide & Architectural Q&A

This document prepares software engineers to defend the architectural, security, database, and AI design choices of **Abhi.iterates-OS** in senior technical interviews.

---

## Top 10 Technical Architectural Questions & Answers

### 1. Q: Why did you choose PostgreSQL with `pgvector` instead of a dedicated vector database like Pinecone or Qdrant?
- **Answer**:
  > *"Choosing PostgreSQL with `pgvector` allowed us to maintain **ACID transactional consistency** across both relational academic data and vector embeddings within a single database system. Dedicated vector databases introduce distributed state synchronization challenges (e.g., what happens when a student deletes a document or resource in Postgres while vector deletion fails in Pinecone?). With `pgvector`, deleting a resource cascades transactionally to its chunk embeddings in a single atomic transaction. Furthermore, HNSW indexing in `pgvector` provides $O(\log N)$ search speeds (~8.5ms latency across 5,000 vectors), eliminating the operational complexity and cost of managing a second database infrastructure."*

### 2. Q: Why did you build a deterministic Study Planner instead of asking an LLM to generate the study schedule?
- **Answer**:
  > *"Study planning requires strict **reproducibility**, **predictability**, **debuggability**, and **unit testability**. LLM-generated schedules suffer from non-determinism, hallucinated dates, and arbitrary priority shifts. By implementing graph-based Topological Sorting for prerequisite DAGs combined with explicit heuristic scoring equations ($w_m S_{\text{mastery}} + w_e S_{\text{exam}} + w_p S_{\text{prereq}}$), our planner guarantees 100% deterministic, testable behavior. We restrict LLMs strictly to tasks where creative language generation is required—such as grounded RAG tutoring and assessment question drafting."*

### 3. Q: How do you prevent Insecure Direct Object Reference (IDOR) attacks across user endpoints?
- **Answer**:
  > *"We enforce user data isolation at the service level rather than relying solely on controller checks. When a user authenticates, Spring Security populates the `SecurityContextHolder` with their authenticated `userId`. All repository queries explicitly filter records using `WHERE user_id = :authUserId`. If User A attempts to request or mutate User B's resource ID, the query returns 0 rows, resulting in a clean `404 Not Found` or `403 Forbidden` response. We explicitly verify this isolation across 8 domain boundaries in our `IdorSecurityIntegrationTest` integration test suite."*

### 4. Q: How do you handle N+1 query problems in Hibernate when fetching dashboard aggregates?
- **Answer**:
  > *"We avoid N+1 query overhead by replacing default lazy collection iteration with custom bulk `JOIN FETCH` JPQL queries and DTO projections. For example, in `AcademicDashboardServiceImpl`, instead of executing 100 separate queries for each topic's study progress inside a loop, we execute 4 bulk JPQL queries that join topics, subjects, and session aggregates in bulk, reducing dashboard render database latency from >300ms to 14.2ms."*

### 5. Q: Why use Server-Sent Events (SSE) over WebSockets for AI Tutor streaming?
- **Answer**:
  > *"SSE is a lightweight, unidirectional HTTP standard built specifically for server-to-client streaming. Since RAG tutor responses stream content in one direction from the server to the browser, SSE operates over standard HTTP/1.1 or HTTP/2 without requiring WebSocket handshake protocol upgrades, custom frame parsers, or complex connection state management. SSE also handles automatic browser reconnection natively."*

### 6. Q: How do you mitigate RAG prompt injection risks from untrusted user documents?
- **Answer**:
  > *"User-uploaded documents could contain prompt injection text (e.g. 'Ignore previous instructions...'). We mitigate this by wrapping retrieved document chunks strictly inside `<context>` XML isolation tags in the LLM system prompt. The prompt explicitly instructs the LLM that content inside `<context>` is untrusted reference data only and must never be interpreted as system instructions."*

### 7. Q: How is database migration managed across environments?
- **Answer**:
  > *"We use Flyway versioned SQL migrations (`V1__...` through `V10__...`) located in `db/migration/`. Migrations are executed automatically on Spring Boot container startup. Historical migration files are strictly immutable; schema evolutions (such as adding `exam_topics` in V10) are added as new migration scripts."*

### 8. Q: How do you structure unit vs integration tests for AI features?
- **Answer**:
  > *"We mock third-party LLM API HTTP calls during automated build testing using Spring AI test stubs and `@MockBean` service definitions. This ensures our 236 backend tests run in under 85 seconds without incurring LLM API costs or breaking CI builds due to external network outages."*

### 9. Q: Why did you choose a Modular Monolith architecture instead of Microservices?
- **Answer**:
  > *"For our system's scope, a Modular Monolith provides clear domain boundaries (Academic, Planner, Assessment, AI) while eliminating network latency, distributed tracing overhead, and complex saga transactions across services. All domains run in a single process with shared ACID database transactions."*

### 10. Q: What is the core architectural differentiator of Abhi.iterates-OS?
- **Answer**:
  > *"The core differentiator is the **Closed Academic Feedback Loop**. Most student applications are disconnected point tools (a note app, a separate flashcard app, a standalone AI chat). Abhi.iterates-OS connects everything: study sessions lead to grounded tutoring, tutoring leads to direct assessment, assessment attempt scoring updates longitudinal evidence, and evidence dynamically drives adaptive study planning."*
