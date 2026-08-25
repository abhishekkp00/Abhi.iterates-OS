package com.abhiiterates.os.auth;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.config.JwtProperties;
import com.abhiiterates.os.user.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String TEST_SECRET = "very-secret-jwt-key-that-is-at-least-256-bits-long-for-hmac-sha256";
    private JwtTokenProvider jwtTokenProvider;
    private JwtProperties jwtProperties;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setSecret(TEST_SECRET);
        jwtProperties.setExpirationMs(3600000L); // 1 hour
        jwtProperties.setRefreshExpirationMs(86400000L); // 24 hours

        jwtTokenProvider = new JwtTokenProvider(jwtProperties);
        testUser = UserTestFactory.createRegularUser("jwt_test");
    }

    @Test
    void constructor_withNullOrShortSecret_throwsException() {
        JwtProperties invalidProperties = new JwtProperties();
        invalidProperties.setSecret("short");

        assertThatThrownBy(() -> new JwtTokenProvider(invalidProperties))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 256 bits");
    }

    @Test
    void generateAccessToken_withValidUser_createsSignedJwtWithSubjectAndEmail() {
        String token = jwtTokenProvider.generateAccessToken(testUser);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.extractEmail(token)).isEqualTo(testUser.getEmail());
    }

    @Test
    void validateToken_withTamperedSignature_returnsFalse() {
        String validToken = jwtTokenProvider.generateAccessToken(testUser);
        String tamperedToken = validToken.substring(0, validToken.lastIndexOf('.') + 1) + "invalidSignature";

        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    void validateToken_withExpiredToken_returnsFalse() {
        // Create expired token manually with same secret key
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        String expiredToken = Jwts.builder()
                .subject(testUser.getEmail())
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(key)
                .compact();

        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    @Test
    void validateToken_withMalformedToken_returnsFalse() {
        assertThat(jwtTokenProvider.validateToken("not.a.valid.jwt.token")).isFalse();
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }
}
