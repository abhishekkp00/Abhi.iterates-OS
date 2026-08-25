package com.abhiiterates.os.common;

import com.abhiiterates.os.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * In-Memory Sliding Window Rate Limiter for expensive operations (AI generation, RAG streaming, document ingestion).
 * Operates without external Redis dependencies.
 */
@Service
@Slf4j
public class RateLimiterService {

    private static final int DEFAULT_MAX_REQUESTS_PER_MINUTE = 30;
    private static final long ONE_MINUTE_MS = 60_000L;

    private final Map<String, ConcurrentLinkedQueue<Long>> userRequestTimestamps = new ConcurrentHashMap<>();

    /**
     * Checks rate limit for a specific operation and user.
     * Throws RateLimitExceededException (429) if threshold is exceeded.
     */
    public void checkRateLimit(UUID userId, String actionKey, int maxRequestsPerMinute) {
        if (userId == null) return;

        String rateKey = userId + ":" + actionKey;
        long now = Instant.now().toEpochMilli();
        long windowStart = now - ONE_MINUTE_MS;

        ConcurrentLinkedQueue<Long> timestamps = userRequestTimestamps.computeIfAbsent(rateKey, k -> new ConcurrentLinkedQueue<>());

        // Evict expired timestamps outside current window
        while (!timestamps.isEmpty() && timestamps.peek() < windowStart) {
            timestamps.poll();
        }

        if (timestamps.size() >= maxRequestsPerMinute) {
            log.warn("Rate limit exceeded for user [{}] on action [{}] ({} requests in last minute)", userId, actionKey, timestamps.size());
            throw new RateLimitExceededException("Rate limit exceeded for " + actionKey + ". Please wait before submitting additional requests.");
        }

        timestamps.add(now);
    }

    public void checkRateLimit(UUID userId, String actionKey) {
        checkRateLimit(userId, actionKey, DEFAULT_MAX_REQUESTS_PER_MINUTE);
    }
}
