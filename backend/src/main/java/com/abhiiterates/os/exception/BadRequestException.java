package com.abhiiterates.os.exception;

/**
 * Exception thrown when a user submits malformed, invalid, or illegal request payloads.
 * Maps to HTTP 400 Bad Request.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
