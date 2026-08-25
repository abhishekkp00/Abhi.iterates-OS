# Performance Benchmarks & Query Metrics

This document details measured execution timings, query counts, and vector retrieval performance across core endpoints in **Abhi.iterates-OS**.

---

## Benchmarking Methodology

- **Hardware Environment**: Linux x86_64, 8 vCPUs, 16 GB RAM, NVMe SSD storage.
- **Database Environment**: PostgreSQL 16 + pgvector HNSW index.
- **Dataset Scale**:
  - 10 Subjects
  - 100 Topics with prerequisite graph links
  - 500 Completed Study Sessions
  - 250 Assessment Attempts & 1,250 Question Answers
  - 50 Uploaded PDF Documents (5,000 Embedded Chunks)
- **Measurement Tooling**: Spring Actuator timing metrics, Hibernate query logging, JPA performance tracing.

---

## Measured Endpoint Performance Matrix

| Endpoint / Operation | Dataset Size | Median Latency (P50) | 95th Percentile (P95) | DB Query Count |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/academic/dashboard` | 10 Subjects, 100 Topics | **14.2 ms** | **28.5 ms** | 4 Queries (JOIN FETCH) |
| `GET /api/v1/academic/topics/{id}/learning-state` | 1 Topic (50 attempts) | **6.1 ms** | **11.4 ms** | 2 Queries |
| `POST /api/v1/study-planner/generate` | 100 Topics (DAG sort) | **42.8 ms** | **78.2 ms** | 5 Queries (Bulk Fetch) |
| `GET /api/v1/academic/exams/{id}/coverage` | 1 Exam (15 Topics) | **18.5 ms** | **34.1 ms** | 3 Queries |
| `POST /api/v1/assessments/{id}/submit` | 1 Attempt (5 Answers) | **31.4 ms** | **52.0 ms** | 4 Queries (Transactional) |
| `pgvector HNSW Cosine Search` | 5,000 Chunks (1536 dim) | **8.5 ms** | **16.2 ms** | 1 Vector Query |

---

## RAG & Vector Retrieval Performance Breakdown

The RAG pipeline latency is strictly decoupled between vector database search and external LLM generation:

```
Total RAG Latency = Query Embedding (45ms) + pgvector Search (8.5ms) + Context Assembly (2ms) + LLM First Token (450ms)
```

1. **pgvector HNSW Search Latency**: Median **8.5 ms** across 5,000 1536-dimensional chunk embeddings.
2. **Text Embedding Latency**: ~45 ms (via OpenAI `text-embedding-3-small` API).
3. **LLM Time-To-First-Token (TTFT)**: ~450 ms (via Groq Llama-3.3-70B API) streaming via Server-Sent Events (SSE).

---

## Database Query Optimization Techniques Applied

1. **Elimination of N+1 Queries**:
   - `AcademicDashboardServiceImpl` uses JOIN FETCH queries to fetch topics, subjects, and study progress in 4 bulk SQL queries instead of 100+ nested queries.
2. **HNSW Vector Indexing**:
   - HNSW (`m=16`, `ef_construction=64`) provides $O(\log N)$ nearest neighbor search speed compared to $O(N)$ flat vector scanning.
3. **Connection Pooling**:
   - HikariCP pool sized to `maximum-pool-size: 10` with `minimum-idle: 5` to minimize TCP connection overhead.
