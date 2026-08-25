package com.abhiiterates.os.ai.context.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rag.context")
public class RagContextProperties {

    /**
     * Master toggle for RAG context retrieval injection into AI prompt.
     */
    private boolean enabled = true;

    /**
     * Maximum number of document chunks allowed into prompt context.
     */
    private int maxChunks = 5;

    /**
     * Maximum total characters allowed in prompt context.
     */
    private int maxCharacters = 4000;
}
