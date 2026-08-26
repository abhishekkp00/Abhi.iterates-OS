# Scalability Architecture & Bottlenecks Analysis

This document analyzes current system bottlenecks and outlines future horizontal scaling strategies for **Abhi.iterates-OS**.

---

## Architectural Principle: Honest Monolithic Efficiency

Before proposing complex microservices, **Abhi.iterates-OS** maximizes single-node hardware efficiency. A modular Spring Boot application with HikariCP connection pooling and PostgreSQL HNSW indexing easily handles **10,000+ active daily students** on a standard $40/month server.

---

## Bottleneck Analysis & Future Scaling Strategy

```
  Current Bottleneck                  Scaling Mechanism                  Future State
┌─────────────────────┐             ┌────────────────────┐             ┌─────────────────────┐
│ 1. Synchronous PDF  │────────────►│ Async Message Queue│────────────►│ Background Worker   │
│ Chunk Extraction    │             │ (RabbitMQ / SQS)   │             │ Ingestion Cluster   │
└─────────────────────┘             └────────────────────┘             └─────────────────────┘
┌─────────────────────┐             ┌────────────────────┐             ┌─────────────────────┐
│ 2. Third-Party LLM  │────────────►│ Redis Cache Layer  │────────────►│ Cached Frequency    │
│ Generation Latency  │             │ (Semantic Cache)   │             │ Answer Retrieval    │
└─────────────────────┘             └────────────────────┘             └─────────────────────┘
┌─────────────────────┐             ┌────────────────────┐             ┌─────────────────────┐
│ 3. Database Read    │────────────►│ PostgreSQL Read    │────────────►│ Primary Read/Write  │
│ Traffic Spikes      │             │ Replicas           │             │ Separation          │
└─────────────────────┘             └────────────────────┘             └─────────────────────┘
```

### 1. Document Extraction & Embedding Ingestion
- **Current Bottleneck**: Synchronous PDF text extraction (Apache Tika) and vector embedding calls block HTTP thread during large document uploads.
- **Future Strategy**:
  - Offload document parsing to an asynchronous background worker queue (Spring `@Async` or RabbitMQ / AWS SQS worker).
  - Store uploaded raw PDF files in AWS S3 or MinIO S3 object storage rather than local disk.

### 2. LLM Third-Party Latency & Rate Limits
- **Current Architecture**: Rate limiting is handled via in-process Bucket4j (`AiRateLimiterService`), avoiding external Redis dependencies. LLM responses stream incrementally over Server-Sent Events (SSE).
- **Future Strategy**:
  - Implement an in-memory or distributed **Semantic Cache** for frequently asked academic questions to return instant responses ($<20\text{ms}$) without invoking third-party LLM APIs.
  - Implement dynamic fallback provider rotation (e.g. OpenAI $\rightarrow$ Groq $\rightarrow$ Ollama local model).

### 3. PostgreSQL & Vector Storage Read Volume
- **Current Bottleneck**: High concurrent dashboard queries and vector similarity searches read from a single PostgreSQL primary node.
- **Future Strategy**:
  - Deploy PostgreSQL **Read Replicas** for query-heavy operations (`GET /dashboard`, `GET /topics`, RAG retrieval queries).
  - Isolate vector embeddings into a dedicated pgvector cluster if index size exceeds host RAM bounds.
