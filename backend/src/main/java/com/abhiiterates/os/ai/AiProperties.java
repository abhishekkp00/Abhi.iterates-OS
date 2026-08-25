package com.abhiiterates.os.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Binds the {@code ai:} block from application.yml.
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

    /**
     * Rate limiting configuration for AI chat endpoints.
     * Prevents any single user from exhausting the LLM API quota.
     */
    private RateLimit rateLimit = new RateLimit();

    @Getter
    @Setter
    public static class RateLimit {

        /**
         * Maximum number of streaming chat requests a single user may make per minute.
         * Each stream call invokes the LLM and may consume significant token quota.
         * Default: 10 requests/minute.
         */
        private int streamRequestsPerMinute = 10;

        /**
         * Maximum number of blocking chat requests a single user may make per minute.
         * Default: 20 requests/minute.
         */
        private int chatRequestsPerMinute = 20;

        /**
         * Time-to-live (in minutes) for idle user buckets.
         * Buckets that have not been accessed for this duration are evicted to
         * prevent unbounded memory growth. Default: 60 minutes.
         */
        private int bucketIdleEvictionMinutes = 60;
    }
}
