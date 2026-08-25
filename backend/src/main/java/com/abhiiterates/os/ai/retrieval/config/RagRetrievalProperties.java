package com.abhiiterates.os.ai.retrieval.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rag.retrieval")
public class RagRetrievalProperties {

    /**
     * Default top-K candidate chunks to retrieve per semantic query.
     */
    private int topK = 5;

    /**
     * Hard maximum limit for top-K requests to protect backend resources.
     */
    private int maxTopK = 50;

    /**
     * Default similarity threshold (between 0.0 and 1.0, where 1.0 = identical).
     */
    private double similarityThreshold = 0.60;
}
