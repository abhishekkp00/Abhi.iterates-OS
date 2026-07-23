package com.abhiiterates.os.auth;

import com.abhiiterates.os.config.JwtProperties;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.Random;
import java.util.UUID;

/**
 * OAuth2 Authentication Success Handler.
 * Intercepts successful Google OAuth2 logins, provisions user accounts if new,
 * generates JWT tokens, and redirects back to the React SPA frontend.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Value("${cors.allowed-origins:http://localhost:5180}")
    private String allowedOrigins;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String givenName = oAuth2User.getAttribute("given_name");
        String familyName = oAuth2User.getAttribute("family_name");

        log.info("Google OAuth2 Authentication successful for email: {}", email);

        if (email == null || email.isBlank()) {
            log.error("Google OAuth2 user object does not contain email attribute");
            response.sendRedirect(allowedOrigins + "/login?error=EmailNotProvided");
            return;
        }

        // Retrieve existing user or create a new one
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            log.info("Provisioning new account for Google user: {}", email);

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Default User Role not found in database."));

            String baseUsername = email.contains("@") ? email.split("@")[0] : "google_user";
            String finalUsername = baseUsername;
            Random random = new Random();

            while (userRepository.existsByUsername(finalUsername)) {
                finalUsername = baseUsername + (1000 + random.nextInt(9000));
            }

            User newUser = User.builder()
                    .email(email)
                    .username(finalUsername)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(givenName != null ? givenName : (name != null ? name : "Google"))
                    .lastName(familyName != null ? familyName : "User")
                    .roles(Collections.singleton(userRole))
                    .active(true)
                    .emailVerified(true)
                    .build();

            return userRepository.save(newUser);
        });

        // Issue Access Token
        String accessToken = jwtTokenProvider.generateAccessToken(user);

        // Issue Refresh Token
        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        // Determine frontend base URL
        String redirectOrigin = allowedOrigins.split(",")[0].trim();
        String targetUrl = UriComponentsBuilder.fromUriString(redirectOrigin + "/login")
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshTokenStr)
                .build().toUriString();

        log.info("Redirecting authenticated Google user to frontend: {}", targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
