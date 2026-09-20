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
    id        UUID    PRIMARY KEY,
    content   TEXT,
    metadata  ${jsonb-type},
    embedding ${vector-type}
);

${vector-store-indexes}
