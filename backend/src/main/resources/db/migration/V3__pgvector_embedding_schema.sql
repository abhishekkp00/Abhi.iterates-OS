-- =============================================================================
-- Flyway Migration V3: Pgvector Embedding Schema for RAG Pipeline
-- Tables for tracking document chunk embeddings, vector storage, and embedding status.
-- =============================================================================

-- 0. Vector Extension Initialization (PostgreSQL: CREATE EXTENSION / H2: CREATE DOMAIN)
${vector-extension-init}

-- 1. Add Embedding Status Columns to RAG Documents Metadata Table
ALTER TABLE rag_documents ADD COLUMN embedding_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE rag_documents ADD COLUMN embedding_failure_reason VARCHAR(1000);

-- Index for embedding status filtering
CREATE INDEX idx_rag_docs_embedding_status ON rag_documents (embedding_status);

-- 2. RAG Document Chunk Embeddings Table
CREATE TABLE rag_document_chunk_embeddings (
    id UUID NOT NULL PRIMARY KEY,
    chunk_id UUID NOT NULL REFERENCES rag_document_chunks(id) ON DELETE CASCADE,
    embedding_model VARCHAR(255) NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    vector vector NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_by VARCHAR(255),
    CONSTRAINT uq_rag_embedding_chunk_model UNIQUE (chunk_id, embedding_model)
);

-- Indexes for Vector Embedding Lookups & Versioning
CREATE INDEX idx_rag_emb_chunk_id ON rag_document_chunk_embeddings (chunk_id);
CREATE INDEX idx_rag_emb_model ON rag_document_chunk_embeddings (embedding_model);
