package com.calm.admin.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiting service to prevent brute force attacks.
 * For production with multiple instances, use Redis-based rate limiting.
 */
@Service
public class RateLimitingService {

    @Value("${rate.limit.login.attempts:5}")
    private int maxAttempts;

    @Value("${rate.limit.login.duration:60}")
    private int durationSeconds;

    private final Map<String, RateLimitEntry> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        RateLimitEntry entry = attempts.get(key);
        if (entry == null) {
            return false;
        }

        // Clean up expired entries
        if (entry.isExpired()) {
            attempts.remove(key);
            return false;
        }

        return entry.getAttempts() >= maxAttempts;
    }

    public void recordAttempt(String key) {
        attempts.compute(key, (k, entry) -> {
            if (entry == null || entry.isExpired()) {
                return new RateLimitEntry(1, Instant.now().plusSeconds(durationSeconds));
            }
            entry.incrementAttempts();
            return entry;
        });
    }

    public void resetAttempts(String key) {
        attempts.remove(key);
    }

    public int getRemainingAttempts(String key) {
        RateLimitEntry entry = attempts.get(key);
        if (entry == null || entry.isExpired()) {
            return maxAttempts;
        }
        return Math.max(0, maxAttempts - entry.getAttempts());
    }

    public long getBlockedUntil(String key) {
        RateLimitEntry entry = attempts.get(key);
        if (entry == null || entry.isExpired()) {
            return 0;
        }
        return entry.getExpiresAt().getEpochSecond();
    }

    private static class RateLimitEntry {
        private int attempts;
        private final Instant expiresAt;

        public RateLimitEntry(int attempts, Instant expiresAt) {
            this.attempts = attempts;
            this.expiresAt = expiresAt;
        }

        public int getAttempts() {
            return attempts;
        }

        public void incrementAttempts() {
            this.attempts++;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}

