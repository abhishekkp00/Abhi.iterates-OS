package com.abhiiterates.os.ai;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-user AI chat rate limiter backed by Bucket4j token-bucket algorithm.
 *
 * <p>Design decisions:
 * <ul>
 *   <li><b>In-memory only</b> — no Redis required at current scale. If the service
 *       becomes multi-instance, replace {@code buckets} with a distributed Bucket4j
 *       backend (Redis/Hazelcast). The interface contract does not change.</li>
 *   <li><b>Two separate bucket types</b> — stream and chat have independent limits
 *       because streaming requests are significantly more expensive (token streaming
 *       holds an LLM connection open for up to 5 minutes).</li>
 *   <li><b>Scheduled eviction</b> — idle buckets are evicted every
 *       {@code ai.rate-limit.bucket-idle-eviction-minutes} minutes so the map
 *       does not grow unboundedly for large user bases.</li>
 *   <li><b>ADMIN bypass</b> — users with the {@code ROLE_ADMIN} authority skip
 *       rate limiting entirely, allowing admin testing without hitting quotas.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiRateLimiterService {

    private final AiProperties aiProperties;

    /**
     * Tracks stream-chat buckets keyed by user ID.
     * Entry: [Bucket, lastAccessedInstant]
     */
    private final ConcurrentHashMap<UUID, BucketEntry> streamBuckets = new ConcurrentHashMap<>();

    /**
     * Tracks blocking-chat buckets keyed by user ID.
     */
    private final ConcurrentHashMap<UUID, BucketEntry> chatBuckets = new ConcurrentHashMap<>();

    // Rebuilt on startup and after config changes
    private Bandwidth streamBandwidth;
    private Bandwidth chatBandwidth;

    @PostConstruct
    void init() {
        rebuildBandwidths();
        log.info("AI rate limiter initialized — stream: {}/min, chat: {}/min, eviction TTL: {}min",
                aiProperties.getRateLimit().getStreamRequestsPerMinute(),
                aiProperties.getRateLimit().getChatRequestsPerMinute(),
                aiProperties.getRateLimit().getBucketIdleEvictionMinutes());
    }

    private void rebuildBandwidths() {
        streamBandwidth = Bandwidth.builder()
                .capacity(aiProperties.getRateLimit().getStreamRequestsPerMinute())
                .refillGreedy(aiProperties.getRateLimit().getStreamRequestsPerMinute(), Duration.ofMinutes(1))
                .build();

        chatBandwidth = Bandwidth.builder()
                .capacity(aiProperties.getRateLimit().getChatRequestsPerMinute())
                .refillGreedy(aiProperties.getRateLimit().getChatRequestsPerMinute(), Duration.ofMinutes(1))
                .build();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Attempts to consume one token from the user's streaming bucket.
     *
     * @param userId   the authenticated user's UUID
     * @param isAdmin  if true, the check is bypassed (admin users have no limit)
     * @return {@code true} if the request is allowed, {@code false} if rate-limited
     */
    public boolean tryConsumeStreamToken(UUID userId, boolean isAdmin) {
        if (isAdmin) return true;
        return streamBuckets
                .computeIfAbsent(userId, id -> new BucketEntry(buildBucket(streamBandwidth)))
                .tryConsume();
    }

    /**
     * Attempts to consume one token from the user's blocking-chat bucket.
     *
     * @param userId   the authenticated user's UUID
     * @param isAdmin  if true, the check is bypassed
     * @return {@code true} if the request is allowed, {@code false} if rate-limited
     */
    public boolean tryConsumeChatToken(UUID userId, boolean isAdmin) {
        if (isAdmin) return true;
        return chatBuckets
                .computeIfAbsent(userId, id -> new BucketEntry(buildBucket(chatBandwidth)))
                .tryConsume();
    }

    /**
     * Returns the number of stream tokens remaining in the user's current window.
     * Used to populate the {@code X-RateLimit-Remaining} response header.
     */
    public long streamTokensRemaining(UUID userId) {
        BucketEntry entry = streamBuckets.get(userId);
        return (entry == null) ? aiProperties.getRateLimit().getStreamRequestsPerMinute()
                : entry.getBucket().getAvailableTokens();
    }

    /**
     * Returns the number of chat tokens remaining in the user's current window.
     */
    public long chatTokensRemaining(UUID userId) {
        BucketEntry entry = chatBuckets.get(userId);
        return (entry == null) ? aiProperties.getRateLimit().getChatRequestsPerMinute()
                : entry.getBucket().getAvailableTokens();
    }

    // ── Scheduled eviction ────────────────────────────────────────────────────

    /**
     * Evicts idle buckets every 30 minutes.
     * A bucket is considered idle if it has not been accessed within the configured TTL.
     */
    @Scheduled(fixedDelay = 30 * 60 * 1000L)
    void evictIdleBuckets() {
        long evictionMinutes = aiProperties.getRateLimit().getBucketIdleEvictionMinutes();
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(evictionMinutes));

        int streamEvicted = evict(streamBuckets, cutoff);
        int chatEvicted = evict(chatBuckets, cutoff);

        if (streamEvicted + chatEvicted > 0) {
            log.debug("Rate limiter eviction: removed {} stream + {} chat idle buckets",
                    streamEvicted, chatEvicted);
        }
    }

    private int evict(ConcurrentHashMap<UUID, BucketEntry> map, Instant cutoff) {
        int count = 0;
        for (Map.Entry<UUID, BucketEntry> e : map.entrySet()) {
            if (e.getValue().getLastAccessed().isBefore(cutoff)) {
                map.remove(e.getKey());
                count++;
            }
        }
        return count;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Bucket buildBucket(Bandwidth bandwidth) {
        return Bucket.builder().addLimit(bandwidth).build();
    }

    // ── Inner types ───────────────────────────────────────────────────────────

    /**
     * Wraps a {@link Bucket} with its last-access timestamp for TTL-based eviction.
     */
    private static final class BucketEntry {

        private final Bucket bucket;
        private volatile Instant lastAccessed;

        BucketEntry(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccessed = Instant.now();
        }

        Bucket getBucket() {
            return bucket;
        }

        Instant getLastAccessed() {
            return lastAccessed;
        }

        boolean tryConsume() {
            lastAccessed = Instant.now();
            return bucket.tryConsume(1);
        }
    }
}
