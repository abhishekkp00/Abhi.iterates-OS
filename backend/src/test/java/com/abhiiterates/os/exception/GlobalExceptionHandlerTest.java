package com.abhiiterates.os.exception;

import com.abhiiterates.os.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/test");
    }

    @Test
    void handleBadCredentials_returns401Envelope() {
        BadCredentialsException ex = new BadCredentialsException("Invalid password");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadCredentials(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().status()).isEqualTo(401);
        assertThat(response.getBody().message()).contains("Invalid email or password");
    }

    @Test
    void handleAccessDenied_returns403Envelope() {
        AccessDeniedException ex = new AccessDeniedException("Access is denied");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().status()).isEqualTo(403);
    }

    @Test
    void handleResourceNotFoundException_returns404Envelope() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Resource not found with ID: 123");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleResourceNotFoundException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Resource not found with ID: 123");
    }

    @Test
    void handleBadRequestException_returns400Envelope() {
        BadRequestException ex = new BadRequestException("Invalid parameter state");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadRequestException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Invalid parameter state");
    }

    @Test
    void handleDatabaseIntegrityViolation_returns409ConflictEnvelope() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("Duplicate key value violates unique constraint");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleDatabaseIntegrityViolation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("Database constraint violation");
    }

    @Test
    void handleGenericException_masksInternalStackTrace_returns500Envelope() {
        Exception ex = new RuntimeException("Internal NullPointer or Secret Database Stacktrace Details");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGenericException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        // Verify that internal exception detail is masked from the user
        assertThat(response.getBody().message()).doesNotContain("NullPointer");
        assertThat(response.getBody().message()).contains("unexpected internal server error");
    }
}
