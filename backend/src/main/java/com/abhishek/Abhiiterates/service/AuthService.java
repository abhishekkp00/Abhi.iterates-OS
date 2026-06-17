package com.abhishek.Abhiiterates.service;

import com.abhishek.Abhiiterates.dto.*;
import com.abhishek.Abhiiterates.entity.User;
import com.abhishek.Abhiiterates.enums.AuthProvider;
import com.abhishek.Abhiiterates.enums.Role;
import com.abhishek.Abhiiterates.exception.BadRequestException;
import com.abhishek.Abhiiterates.exception.UnauthorizedException;
import com.abhishek.Abhiiterates.repository.UserRepository;
import com.abhishek.Abhiiterates.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${GOOGLE_CLIENT_ID:dummy-client-id}")
    private String googleClientId;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .build();

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    public TokenResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));

            String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .build();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (jwtService.isTokenExpired(refreshToken)) {
            throw new UnauthorizedException("Refresh token is expired. Please login again.");
        }

        String email = jwtService.extractUsername(refreshToken);
        if (email == null) {
            throw new UnauthorizedException("Invalid refresh token claims.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User associated with token does not exist."));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is inactive.");
        }

        // Generate new Access and Refresh Token (Refresh Token Rotation)
        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getEmail());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public TokenResponse googleLogin(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new UnauthorizedException("Invalid Google ID Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                // Register a new user
                user = User.builder()
                        .email(email)
                        .name(name != null ? name : "Google User")
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password for OAuth2 users
                        .role(Role.USER)
                        .provider(AuthProvider.GOOGLE)
                        .avatarUrl(pictureUrl)
                        .isActive(true)
                        .build();
                userRepository.save(user);
            } else {
                // Existing user, update their provider to GOOGLE if it was local, or sync avatar
                if (user.getProvider() != AuthProvider.GOOGLE) {
                    user.setProvider(AuthProvider.GOOGLE);
                }
                if (pictureUrl != null && !pictureUrl.equals(user.getAvatarUrl())) {
                    user.setAvatarUrl(pictureUrl);
                }
                userRepository.save(user);
            }

            if (!user.getIsActive()) {
                throw new UnauthorizedException("User account is inactive.");
            }

            String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .build();

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new UnauthorizedException("Google authentication failed: " + e.getMessage());
        }
    }
}
