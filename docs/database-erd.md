# Database Entity Relationship Diagram (ERD) & Schema Specification

This document details the PostgreSQL relational schema and vector storage structure for **Abhi.iterates-OS**.

---

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o{ user_sessions : "has active"
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ academic_subjects : "creates"
    users ||--o{ academic_goals : "defines"
    users ||--o{ study_plans : "owns"
    users ||--o{ study_sessions : "performs"
    users ||--o{ assessments : "creates"
    users ||--o{ assessment_attempts : "attempts"
    users ||--o{ resources : "uploads"
    users ||--o{ ai_conversations : "holds"

    academic_subjects ||--o{ academic_topics : "contains"
    academic_subjects ||--o{ exams : "evaluated in"

    academic_topics ||--o{ topic_prerequisites : "prerequisite for / depends on"
    academic_topics ||--o{ exam_topics : "included in"
    academic_topics ||--o{ study_sessions : "targeted by"
    academic_topics ||--o{ topic_progress : "tracked by"
    academic_topics ||--o{ assessments : "assessed by"
    academic_topics ||--o{ topic_assessment_performance : "evaluates"

    exams ||--o{ exam_topics : "covers"

    study_plans ||--o{ planned_study_sessions : "contains"
    planned_study_sessions ||--o| study_sessions : "executed in"

    assessments ||--o{ assessment_questions : "contains"
    assessment_questions ||--o{ question_options : "has options"
    assessments ||--o{ assessment_attempts : "attempted via"

    assessment_attempts ||--o{ assessment_answers : "records"
    assessment_questions ||--o{ assessment_answers : "answers question"

    resources ||--o{ resource_attachments : "has files"
    resources ||--o{ rag_documents : "ingested into"

    rag_documents ||--o{ rag_document_chunks : "chunked into"
    rag_document_chunks ||--o{ rag_document_chunk_embeddings : "embedded into"

    ai_conversations ||--o{ ai_messages : "contains"

    users {
        uuid id PK
        string email UK
        string username UK
        string password_hash
        string first_name
        string last_name
        string role
        timestamp created_at
        timestamp updated_at
    }

    academic_subjects {
        uuid id PK
        uuid user_id FK
        string name
        string code
        string color_hex
        timestamp created_at
    }

    academic_topics {
        uuid id PK
        uuid subject_id FK
        uuid user_id FK
        string name
        string description
        integer estimated_hours
        integer target_mastery_percentage
        integer display_order
    }

    topic_prerequisites {
        uuid topic_id PK,FK
        uuid prerequisite_topic_id PK,FK
        string requirement_type
    }

    exams {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        string title
        timestamp exam_date
        integer weight_percentage
        integer target_score_percentage
    }

    study_plans {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        timestamp start_date
        timestamp end_date
        string status
    }

    study_sessions {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        uuid planned_study_session_id FK
        timestamp start_time
        timestamp end_time
        integer actual_duration_minutes
        string session_type
        string status
    }

    assessments {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        string title
        string assessment_type
        integer total_questions
        integer passing_score_percentage
    }

    assessment_attempts {
        uuid id PK
        uuid assessment_id FK
        uuid user_id FK
        integer score_percentage
        boolean passed
        integer duration_seconds
        timestamp submitted_at
    }

    rag_document_chunk_embeddings {
        uuid chunk_id PK,FK
        vector_1536 embedding
        string model_name
        timestamp created_at
    }
```

---

## Database Architecture & Optimization Rules

### 1. Primary Keys & UUIDv4 Strategy
- All primary keys use `UUIDv4` generated via Java application-level generator (`@GeneratedValue(strategy = GenerationType.UUID)`) or DB default (`gen_random_uuid()`).
- **Rationale**: Prevents sequential ID enumeration vulnerabilities and facilitates database sharding/replication.

### 2. Foreign Key Indexes & Constraints
- Foreign key constraints enforce relational integrity across all entities with explicit `ON DELETE CASCADE` rules on child detail tables (`assessment_questions`, `question_options`, `assessment_answers`, `rag_document_chunks`).
- Core entities (`academic_topics`, `study_sessions`, `assessments`, `resources`) use restricted soft delete or foreign key protection to prevent accidental cascade deletion of primary student history.

### 3. Vector Storage & HNSW Indexing (`pgvector`)
- Chunk embeddings are stored in `rag_document_chunk_embeddings` using the `vector(1536)` datatype (optimized for OpenAI `text-embedding-3-small` / `text-embedding-ada-002` dimensions).
- Search performance is accelerated using a **Hierarchical Navigable Small World (HNSW)** index:
  ```sql
  CREATE INDEX idx_rag_chunk_embeddings_hnsw 
  ON rag_document_chunk_embeddings 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);
  ```

### 4. Audit Metadata & Timestamps
- Every primary table includes:
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`
- JPA `@PrePersist` and `@PreUpdate` lifecycle callbacks manage timestamp synchronization.
