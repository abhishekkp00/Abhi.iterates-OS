package com.abhiiterates.os.common;

import lombok.Builder;
import java.time.Instant;

/**
 * Standard API Response Envelope.
 * Enforces uniform structure for all JSON responses returned by the backend.
 *
 * @param <T> Payload Type
 */
@Builder
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        Instant timestamp,
        String path,
        int status
) {
    /**
     * Factory method for successful responses with payload data.
     */
    public static <T> ApiResponse<T> success(T data, String message, String path) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(Instant.now())
                .path(path)
                .status(200) // Default HTTP OK
                .build();
    }

    /**
     * Factory method for successful responses without payload data.
     */
    public static ApiResponse<Void> success(String message, String path) {
        return ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .data(null)
                .timestamp(Instant.now())
                .path(path)
                .status(200)
                .build();
    }

    /**
     * Factory method for error responses.
     */
    public static ApiResponse<Void> error(String message, int status, String path) {
        return ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .data(null)
                .timestamp(Instant.now())
                .path(path)
                .status(status)
                .build();
    }
}
