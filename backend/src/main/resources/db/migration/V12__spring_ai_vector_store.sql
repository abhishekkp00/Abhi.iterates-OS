-- =============================================================================
-- Flyway Migration V12: Spring AI PGVectorStore table
--
-- spring.ai.vectorstore.pgvector.initialize-schema = false in application.yml
-- means Spring AI will NOT auto-create this table.
-- Flyway exclusively owns this DDL.
--
-- Table schema is the Spring AI PgVectorStore canonical schema:
--   id       UUID primary key
--   content  TEXT (the document chunk text)
--   metadata JSONB (all enriched metadata: userId, resourceId, etc.)
--   embedding vector(1536) (the float32 embedding from text-embedding-3-small)
--
-- HNSW index dimensions MUST match spring.ai.vectorstore.pgvector.dimensions
-- and rag.embedding.dimensions (both default to 1536).
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_vector_store (
    id        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
    content   TEXT,
    metadata  JSONB,
    embedding vector(1536)
);

-- HNSW index for fast approximate nearest-neighbour cosine similarity search.
-- m=16 and ef_construction=64 are standard production-grade HNSW parameters.
CREATE INDEX IF NOT EXISTS idx_ai_vector_store_hnsw
    ON ai_vector_store
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index on metadata JSONB for fast metadata-filter lookups (userId, resourceId, etc.)
CREATE INDEX IF NOT EXISTS idx_ai_vector_store_metadata
    ON ai_vector_store
    USING gin (metadata);

-- Expression indexes for the most frequent per-user and per-resource queries.
CREATE INDEX IF NOT EXISTS idx_ai_vector_store_metadata_user
    ON ai_vector_store ((metadata->>'userId'));

CREATE INDEX IF NOT EXISTS idx_ai_vector_store_metadata_resource
    ON ai_vector_store ((metadata->>'resourceId'));
