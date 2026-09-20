package com.abhiiterates.os.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * AiConfig — wires Spring AI ChatClient and VectorStore (PGVector) beans.
 *
 * ChatClient: provider-agnostic; switching from OpenAI to Anthropic, Gemini, or
 * a local Ollama model requires only changing the starter dependency + config properties.
 *
 * VectorStore: backed by PgVectorStore using the Flyway-managed {@code ai_vector_store}
 * table. Spring AI auto-configuration is intentionally overridden here to:
 *  - Lock the table name to {@code ai_vector_store} (not the default {@code vector_store})
 *  - Ensure {@code initializeSchema=false} (Flyway V12 owns the DDL — never Spring AI)
 *  - Bind HNSW + COSINE_DISTANCE to match the Flyway index created in V12
 *  - Use the same EmbeddingModel for both ingestion and retrieval
 *
 * Dimensions (1536) must match:
 *  - spring.ai.vectorstore.pgvector.dimensions in application.yml
 *  - rag.embedding.dimensions in application.yml
 *  - The Flyway V12 vector(1536) column definition
 */
@Configuration
public class AiConfig {

    /**
     * Persistent Spring AI ChatMemory bean backed by JPA AiConversation and AiMessage tables.
     * Configured with a 20-message rolling window to limit context overhead.
     */
    @Bean
    public org.springframework.ai.chat.memory.ChatMemory chatMemory(
            com.abhiiterates.os.ai.memory.PersistentAiChatMemoryRepository persistentChatMemoryRepository) {
        return org.springframework.ai.chat.memory.MessageWindowChatMemory.builder()
                .chatMemoryRepository(persistentChatMemoryRepository)
                .maxMessages(20)
                .build();
    }

    /**
     * ChatClient built from the auto-configured ChatModel bean and configured with MessageChatMemoryAdvisor.
     */
    @Bean
    public ChatClient chatClient(ChatModel chatModel, org.springframework.ai.chat.memory.ChatMemory chatMemory) {
        return ChatClient.builder(chatModel)
                .defaultAdvisors(org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }

    /**
     * VectorStore backed by PostgreSQL + pgvector (HNSW, cosine distance).
     *
     * The {@code ai_vector_store} table stores:
     *   id       UUID
     *   content  TEXT   (chunk text)
     *   metadata JSONB  (userId, resourceId, attachmentId, documentId, fileName, etc.)
     *   embedding vector(1536)
     *
     * {@code initializeSchema(false)} is mandatory — Flyway migration V12 owns the DDL.
     *
     * @param jdbcTemplate   Spring Boot auto-configured JdbcTemplate
     * @param embeddingModel Auto-configured from spring-ai-starter-model-openai
     *                       with model = text-embedding-3-small (from application.yml)
     * @return production-ready VectorStore bean
     */
    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .dimensions(1536)
                .distanceType(PgVectorStore.PgDistanceType.COSINE_DISTANCE)
                .indexType(PgVectorStore.PgIndexType.HNSW)
                .vectorTableName("ai_vector_store")
                .initializeSchema(false)
                .schemaName("public")
                .build();
    }
}
