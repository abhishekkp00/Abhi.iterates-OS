package com.abhiiterates.os.auth;

import com.abhiiterates.os.auth.dto.*;
import com.abhiiterates.os.config.JwtProperties;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.*;
import com.abhiiterates.os.user.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Authentication Service Implementation.
 * Orchestrates business logic for registrations, logins, rotations, and logouts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public UserProfileDto registerUser(RegisterRequest request) {
        log.info("Processing registration for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account is already registered with this email address.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken. Please choose another username.");
        }

        // Fetch the default ROLE_USER
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Default User Role not found in database. Seeding failure?"));

        // Create new User entity
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roles(Collections.singleton(userRole))
                .active(true)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Successfully registered user: {} with ID: {}", savedUser.getEmail(), savedUser.getId());

        return userMapper.toUserProfileDto(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Processing login attempt for email: {}", request.getEmail());

        // Authenticate credentials via Spring AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        
        if (!user.isEnabled()) {
            throw new BadRequestException("This account is currently deactivated or deleted.");
        }

        // 1. Generate Access Token (JWT)
        String accessToken = jwtTokenProvider.generateAccessToken(user);

        // 2. Generate Refresh Token (UUID)
        String tokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenStr)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        
        refreshTokenRepository.save(refreshToken);

        // 3. Track User Session
        UserSession session = UserSession.builder()
                .user(user)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceType(parseDeviceType(userAgent))
                .active(true)
                .lastActive(Instant.now())
                .build();
        
        userSessionRepository.save(session);

        log.info("Successful login for user: {}. Session tracked.", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(tokenStr)
                .expiresIn(jwtProperties.getExpirationMs() / 1000)
                .user(userMapper.toUserProfileDto(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        log.info("Processing token refresh request");

        RefreshToken oldToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new BadRequestException("Invalid or non-existent refresh token."));

        User user = oldToken.getUser();

        // ── Security Check: Check if token has been revoked
        if (oldToken.isRevoked()) {
            log.warn("SECURITY ALERT: Revoked refresh token presented for user: {}! Revoking all sessions.", user.getEmail());
            
            // Revoke all existing non-revoked refresh tokens for this user (Breach detection)
            List<RefreshToken> activeTokens = refreshTokenRepository.findByUserAndRevokedFalse(user);
            activeTokens.forEach(t -> t.setRevoked(true));
            refreshTokenRepository.saveAll(activeTokens);
            
            throw new BadRequestException("Security Breach Warning: This token has been previously used and revoked.");
        }

        // Check if token has expired
        if (oldToken.isExpired()) {
            throw new BadRequestException("Refresh token has expired. Please sign in again.");
        }

        // ── Refresh Token Rotation: Revoke current token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Generate new Access and Refresh tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newTokenStr = UUID.randomUUID().toString();

        RefreshToken newToken = RefreshToken.builder()
                .token(newTokenStr)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        
        refreshTokenRepository.save(newToken);

        log.info("Token refresh completed successfully. Tokens rotated.");

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newTokenStr)
                .expiresIn(jwtProperties.getExpirationMs() / 1000)
                .user(userMapper.toUserProfileDto(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        log.info("Processing logout request");

        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BadRequestException("Invalid or non-existent refresh token."));

        // Revoke the token
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        log.info("Logout successful. Token revoked.");
    }

    private String parseDeviceType(String userAgent) {
        if (userAgent == null) return "UNKNOWN";
        String ua = userAgent.toLowerCase();
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone")) {
            return "MOBILE";
        } else if (ua.contains("tablet") || ua.contains("ipad")) {
            return "TABLET";
        }
        return "DESKTOP";
    }
}
