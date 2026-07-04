package com.abhiiterates.os.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Properties for JWT Security.
 */
@Configuration
@ConfigurationProperties(prefix = "app.security.jwt")
@Getter
@Setter
public class JwtProperties {

    private String secret;

    /**
     * Access Token lifetime in milliseconds. Default is 15 minutes (900000ms).
     */
    private long expirationMs = 900000;

    /**
     * Refresh Token lifetime in milliseconds. Default is 7 days (604800000ms).
     */
    private long refreshExpirationMs = 604800000;
}
