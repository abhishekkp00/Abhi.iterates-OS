package com.abhiiterates.os.ai.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Type-safe, validated application configuration for RAG (Retrieval-Augmented Generation).
 *
 * Exposes unified configuration properties under the {@code rag} prefix in {@code application.yml}.
 *
 * Standard Spring AI Defaults:
 * - {@code chunkSize}: 800 (Official default token limit for Spring AI TokenTextSplitter)
 * - {@code minChunkSizeChars}: 350 (Official default minimum character threshold for TokenTextSplitter)
 * - {@code minChunkLengthToEmbed}: 5 (Official default minimum character length required for embedding)
 * - {@code maxNumChunks}: 10000 (Official default max chunks safety limit for TokenTextSplitter)
 *
 * Project-Specific Configuration:
 * - {@code enabled}: true (Master toggle for RAG features)
 * - {@code topK}: 5 (Default top candidate vector chunks retrieved per search)
 * - {@code maxTopK}: 50 (Maximum upper safety cap for top-K candidate requests)
 * - {@code similarityThreshold}: 0.60 (Cosine similarity score filter threshold, range 0.0 - 1.0)
 * - {@code maxContextChars}: 4000 (Maximum total RAG prompt context size in characters to preserve LLM token window)
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "rag")
@Validated
public class RagProperties {

    /**
     * Master RAG feature toggle.
     * Project-specific configuration.
     */
    private boolean enabled = true;

    /**
     * Target chunk size in tokens for document text splitting.
     * Spring AI default: 800 tokens (TokenTextSplitter).
     */
    @Min(value = 50, message = "Chunk size must be at least 50 tokens")
    @Max(value = 8000, message = "Chunk size cannot exceed 8000 tokens")
    private int chunkSize = 800;

    /**
     * Minimum chunk size in characters required for a chunk to be formed.
     * Spring AI default: 350 characters (TokenTextSplitter).
     */
    @Min(value = 1, message = "Min chunk size chars must be at least 1")
    private int minChunkSizeChars = 350;

    /**
     * Minimum chunk character length to be sent for embedding.
     * Spring AI default: 5 characters (TokenTextSplitter).
     */
    @Min(value = 1, message = "Min chunk length to embed must be at least 1")
    private int minChunkLengthToEmbed = 5;

    /**
     * Maximum number of chunks produced during text splitting.
     * Spring AI default: 10000 (TokenTextSplitter).
     */
    @Min(value = 1, message = "Max num chunks must be at least 1")
    private int maxNumChunks = 10000;

    /**
     * Default candidate chunk count retrieved from similarity search.
     * Project-specific configuration.
     */
    @Min(value = 1, message = "Top-K must be at least 1")
    @Max(value = 100, message = "Top-K cannot exceed 100")
    private int topK = 5;

    /**
     * Hard upper safety ceiling for top-K candidate chunk requests.
     * Project-specific configuration.
     */
    @Min(value = 1, message = "Max top-K must be at least 1")
    @Max(value = 500, message = "Max top-K cannot exceed 500")
    private int maxTopK = 50;

    /**
     * Cosine similarity threshold for vector similarity matching (0.0 to 1.0).
     * Project-specific configuration.
     */
    @DecimalMin(value = "0.0", message = "Similarity threshold cannot be negative")
    @DecimalMax(value = "1.0", message = "Similarity threshold cannot exceed 1.0")
    private double similarityThreshold = 0.60;

    /**
     * Maximum total characters allowed for RAG context in prompt injection.
     * Project-specific configuration.
     */
    @Min(value = 100, message = "Max context chars must be at least 100")
    @Max(value = 100000, message = "Max context chars cannot exceed 100000")
    private int maxContextChars = 4000;
}
