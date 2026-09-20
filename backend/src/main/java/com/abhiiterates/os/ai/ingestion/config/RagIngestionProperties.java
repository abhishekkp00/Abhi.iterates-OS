package com.abhiiterates.os.ai.ingestion.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rag.ingestion")
public class RagIngestionProperties {
    private boolean enabled = true;
    private int chunkSize = 800;
    private int minChunkSizeChars = 350;
    private int minChunkLengthToEmbed = 5;
    private int maxNumChunks = 10000;
    private boolean keepSeparator = true;
}
