package com.abhiiterates.os.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security Configuration.
 * 
 * Day 4: Bootstrap security setup.
 * All endpoints are currently permitted. Real authentication will be added in Day 5 using JWT.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF since APIs are stateless (JWT-based)
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configure CORS
            .cors(cors -> {})
            
            // Set stateless session policy
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Authorize requests
            .authorizeHttpRequests(auth -> auth
                // Allow public access to API docs and Swagger UI
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/api-docs/**"
                ).permitAll()
                // Allow public access to monitoring Actuator endpoints
                .requestMatchers("/actuator/**").permitAll()
                // Allow public access to base health endpoint
                .requestMatchers("/api/v1/health").permitAll()
                // permitAll for other endpoints on Day 4 to avoid blocking base setup verification
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
