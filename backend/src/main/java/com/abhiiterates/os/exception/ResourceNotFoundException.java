package com.abhiiterates.os.exception;

/**
 * Exception thrown when a requested database entity or file resource is not found.
 * Maps to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
