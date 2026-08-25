# ADR-001: PostgreSQL with pgvector for Relational and Vector Storage

## Status
**Accepted**

## Context
Abhi.iterates-OS requires storing both relational student academic data (subjects, topics, study sessions, assessments, exams) and vector embeddings generated from uploaded PDF textbook chunks for similarity search.

We evaluated two architectural approaches:
1. **Dual Storage Architecture**: PostgreSQL for relational data + External Vector DB (Pinecone / Qdrant) for vector embeddings.
2. **Unified Single-Database Architecture**: PostgreSQL 16 with the `pgvector` extension for both relational tables and vector embeddings.

## Decision
We decided to adopt **PostgreSQL 16 with `pgvector`** as the single primary database.

## Rationale & Trade-offs

### Advantages:
- **ACID Transactional Integrity**: Deleting a resource cascades atomically to its document chunks and vector embeddings in a single SQL transaction.
- **Operational Simplicity**: Single database to manage, back up, monitor, and deploy.
- **Performance**: HNSW cosine similarity indexing in `pgvector` delivers P50 search latency of **8.5 ms** across 5,000 1536-dimensional vectors.
- **Cost**: No external SAAS subscriptions or additional database nodes required.

### Trade-offs & Consequences:
- **Index Memory Footprint**: HNSW indexes require host RAM. If vector dataset grows to tens of millions of vectors, dedicated vector replicas or memory tuning will be required.
