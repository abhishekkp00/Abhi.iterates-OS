-- =============================================================================
-- Flyway Migration V2: Document Ingestion Schema for RAG Pipeline
-- Tables for tracking document ingestion metadata, page counts, lifecycle status,
-- and page-aware text chunks for future embedding and vector indexing.
-- =============================================================================

-- 1. RAG Documents Metadata Table
CREATE TABLE rag_documents (
    id UUID NOT NULL PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL UNIQUE REFERENCES resource_attachments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 0,
    extracted_char_count BIGINT NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    failure_reason VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 2. RAG Document Chunks Table
CREATE TABLE rag_document_chunks (
    id UUID NOT NULL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    chunk_text TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_rag_chunk_doc_index UNIQUE (document_id, chunk_index)
);

-- Indexes for RAG Document Ingestion Performance & Isolation
CREATE INDEX idx_rag_docs_resource_id ON rag_documents (resource_id);
CREATE INDEX idx_rag_docs_attachment_id ON rag_documents (attachment_id);
CREATE INDEX idx_rag_docs_status ON rag_documents (status);
CREATE INDEX idx_rag_chunks_document_id ON rag_document_chunks (document_id);
CREATE INDEX idx_rag_chunks_page ON rag_document_chunks (document_id, page_number);
