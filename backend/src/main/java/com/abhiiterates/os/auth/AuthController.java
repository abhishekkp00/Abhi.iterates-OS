package com.abhiiterates.os.auth;

import com.abhiiterates.os.auth.dto.*;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.dto.UserProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST Controller.
 * Exposes endpoints for user registration, login, logout, and token refresh.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication & Identity Management", description = "Endpoints for user onboarding, token issuance, session refresh, and token revocation")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new student account", description = "Validates the user parameters, hashes the password, seeds the default student role, and registers the account.")
    public ResponseEntity<ApiResponse<UserProfileDto>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        UserProfileDto profile = authService.registerUser(request);
        ApiResponse<UserProfileDto> response = ApiResponse.success(
                profile,
                "Registration successful. Please verify your email.",
                servletRequest.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate credentials and obtain tokens", description = "Verifies user credentials, provisions a stateless JWT access token, sets a database-backed refresh token, and logs the session details.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        AuthResponse authResponse = authService.login(request, ipAddress, userAgent);
        ApiResponse<AuthResponse> response = ApiResponse.success(
                authResponse,
                "Authentication successful.",
                servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate expired Access and Refresh Tokens", description = "Accepts a valid, active Refresh Token, rotates it with a newly generated refresh token (RTR policy), and issues a fresh Access Token.")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest servletRequest
    ) {
        AuthResponse authResponse = authService.refresh(request);
        ApiResponse<AuthResponse> response = ApiResponse.success(
                authResponse,
                "Tokens refreshed successfully.",
                servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active session and log out", description = "Invalidates the client refresh token by marking it as revoked, closing the current device session.")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest servletRequest
    ) {
        authService.logout(request.getRefreshToken());
        ApiResponse<Void> response = ApiResponse.success(
                "Logged out successfully.",
                servletRequest.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
