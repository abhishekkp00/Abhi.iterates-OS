package com.abhiiterates.os.ai.embedding.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rag.embedding")
public class RagEmbeddingProperties {

    /**
     * Whether vector embedding generation is enabled.
     */
    private boolean enabled = true;

    /**
     * Embedding model identifier (e.g. text-embedding-3-small).
     */
    private String model = "text-embedding-3-small";

    /**
     * Expected dimension of generated embedding vectors.
     */
    private int dimensions = 1536;

    /**
     * Maximum number of document chunks embedded in a single LLM API batch call.
     */
    private int batchSize = 32;
}
