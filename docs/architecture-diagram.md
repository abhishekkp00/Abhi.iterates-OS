# System Architecture Diagrams

This document illustrates the structural, data flow, and feedback loop diagrams for **Abhi.iterates-OS**.

---

## High-Level System Component Diagram

```mermaid
flowchart TB
    subgraph Client ["Frontend (React 18 SPA)"]
        UI[User Interface / Dashboards]
        State[Zustand & React Query]
        SSEClient[EventSource SSE Client]
    end

    subgraph Security ["Spring Security Context"]
        JWT[JwtAuthenticationFilter]
        UserCtx[SecurityContextHolder]
    end

    subgraph API ["REST API Layer"]
        AuthCtrl[Auth Controller]
        AcadCtrl[Academic Controller]
        PlanCtrl[Planner Controller]
        AssessCtrl[Assessment Controller]
        AICtrl[AI Chat Controller]
    end

    subgraph CoreServices ["Core Application Services"]
        AcadSvc[Academic & Topic Service]
        PlanSvc[Adaptive Planner Engine]
        AssessSvc[Assessment Engine]
        AnalyticsSvc[Learning Analytics Service]
        AISvc[AI Chat & Streaming Service]
    end

    subgraph RAGSystem ["RAG Vector Engine"]
        Ingest[Document Chunking Engine]
        Embed[Spring AI Embedding Model]
        Retriever[pgvector Similarity Retriever]
    end

    subgraph Storage ["PostgreSQL 16 Database"]
        Relational[(Relational Schemas)]
        VectorStore[(pgvector HNSW Index)]
    end

    UI --> JWT
    SSEClient --> AICtrl
    JWT --> UserCtx --> API
    
    AuthCtrl --> AcadSvc
    AcadCtrl --> AcadSvc
    PlanCtrl --> PlanSvc
    AssessCtrl --> AssessSvc
    AICtrl --> AISvc

    PlanSvc --> AnalyticsSvc
    AssessSvc --> AnalyticsSvc
    AISvc --> Retriever
    Ingest --> Embed --> VectorStore

    AcadSvc --> Relational
    PlanSvc --> Relational
    AssessSvc --> Relational
    AnalyticsSvc --> Relational
    Retriever --> VectorStore
```

---

## Primary Closed Feedback Loop Diagram

The core architectural differentiator of Abhi.iterates-OS is its **Closed Feedback Loop**: assessment performance continuously updates mastery states, which instantly reshape study priorities and exam revision schedules.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Dashboard as Academic Dashboard
    participant Study as Study Session Engine
    participant Tutor as Topic-Aware RAG Tutor
    participant Assess as Adaptive Assessment
    participant Analytics as Learning Analytics
    participant Planner as Exam-Aware Revision Engine

    Student->>Dashboard: 1. Views Daily Command Center & Next Action
    Dashboard->>Study: 2. Launches Recommended Study Session
    Study->>Tutor: 3. Needs Help? (Opens Tutor with topicId context)
    Tutor->>Student: 4. Grounded RAG Explanation + Citations
    Tutor->>Assess: 5. Clicks "Test Me" (Direct Topic Assessment Launch)
    Student->>Assess: 6. Submits Completed Assessment Attempt
    Assess->>Analytics: 7. Evaluates Accuracy, Score & Topic Performance
    Analytics->>Planner: 8. Updates Mastery State (WEAK/DEVELOPING/STRONG)
    Planner->>Dashboard: 9. Triggers Dynamic Replanning & Revision Strategy Adjustment
```

---

## RAG Vector Ingestion & Query Pipeline

```mermaid
flowchart LR
    subgraph Ingestion ["1. Document Ingestion Phase"]
        PDF[PDF / Document Upload] --> Extract[Apache Tika Text Extraction]
        Extract --> Chunk[Recursive Character Splitter 500 tokens]
        Chunk --> EmbedGen[Spring AI Vector Embedding]
        EmbedGen --> PGVector[pgvector Table rag_document_chunk_embeddings]
    end

    subgraph Retrieval ["2. Grounded Query & SSE Generation Phase"]
        UserQ[Student Question + topicId] --> QEmbed[Query Vector Embedding]
        QEmbed --> HNSW[HNSW Cosine Distance Search]
        HNSW --> Context[Top-K Relevance Chunks]
        Context --> Prompt[System Prompt + Grounded Chunks]
        Prompt --> LLM[LLM Engine Groq / OpenAI]
        LLM --> SSE[Server-Sent Events Stream]
        SSE --> UI[React UI Markdown + Sources]
    end
```
