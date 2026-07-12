package com.abhiiterates.os.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Binds the `ai:` block from application.yml.
 * Centralizes AI configuration in one type-safe place.
 */
@Configuration
@ConfigurationProperties(prefix = "ai")
@Getter
@Setter
public class AiProperties {

    /**
     * Default system prompt injected into every chat session.
     * Can be overridden per-request via ChatRequest.systemPrompt.
     */
    private String systemPrompt = "You are a helpful AI assistant for students.";
}
