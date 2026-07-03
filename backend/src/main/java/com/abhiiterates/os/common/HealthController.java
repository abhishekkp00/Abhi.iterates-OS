package com.abhiiterates.os.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Foundation Health & Diagnostics Controller.
 * Verifies system uptime, global exception handlers, and input validation engines.
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health & Diagnostics", description = "Endpoints for checking system health and testing validation rules")
@Slf4j
public class HealthController {

    /**
     * Get basic application status.
     * Returns 200 OK.
     */
    @GetMapping
    @Operation(summary = "Get system health status", description = "Returns a simple uptime check confirmation")
    public ApiResponse<Void> getHealth(HttpServletRequest request) {
        log.info("System health check triggered.");
        return ApiResponse.success("System is operational.", request.getRequestURI());
    }

    /**
     * Test body validation.
     * Triggers GlobalExceptionHandler if constraints fail.
     */
    @PostMapping("/test-validation")
    @Operation(summary = "Test Jakarta DTO validation", description = "Validates the request payload DTO against defined validation annotations")
    public ApiResponse<ValidationTestDto> testValidation(
            @Valid @RequestBody ValidationTestDto payload, HttpServletRequest request) {
        
        log.info("Validation test request parsed successfully: name={}, email={}", payload.getName(), payload.getEmail());
        return ApiResponse.success(payload, "Payload passed all validation rules successfully.", request.getRequestURI());
    }

    /**
     * Test exception mapper handling.
     * Triggers uncaught exception log and format mapping.
     */
    @GetMapping("/test-error")
    @Operation(summary = "Test global exception handling mapping", description = "Throws a simulated backend runtime exception to test GlobalExceptionHandler response envelopes")
    public ApiResponse<Void> testError() {
        log.error("Simulating a standard runtime crash request.");
        throw new IllegalStateException("Simulated system state failure. Centralized handler should catch this.");
    }
}
