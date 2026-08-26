# ADR-002: Grounded RAG Architecture for Contextual AI Tutoring

## Status
**Accepted**

## Context
Standard LLM chatbot interactions suffer from hallucinated answers, lack of course material grounding, and absence of verifiable sources. Students require an AI tutor that answers questions strictly using their uploaded course materials and textbook PDFs.

## Decision
We implemented a **Grounded Retrieval-Augmented Generation (RAG) Architecture** leveraging Apache Tika document text extraction, token-bounded recursive chunking (500 tokens), vector embedding generation (Spring AI), pgvector HNSW similarity search, and structured prompt context grounding with explicit source citations.

## Rationale & Trade-offs

### Advantages:
- **Verifiable Citation Grounding**: Every AI response cites the exact source document title and chunk ID.
- **Hallucination Prevention**: System prompts enforce strict context boundaries (`<context>` tags).
- **Topic Scoping**: Vector retrieval filters results by `topicId` context passed from active study sessions.

### Trade-offs & Consequences:
- **Ingestion Latency**: Uploading and embedding large documents incurs initial extraction overhead (~1.2 seconds for a 50-page PDF).
