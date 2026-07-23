package com.abhiiterates.os.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * Global Web Configuration for CORS mappings.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5180}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> patterns = new ArrayList<>(List.of(allowedOrigins));
        if (!patterns.contains("http://localhost:*")) {
            patterns.add("http://localhost:*");
        }
        if (!patterns.contains("http://127.0.0.1:*")) {
            patterns.add("http://127.0.0.1:*");
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(patterns.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600); // Cache preflight response for 1 hour
    }
}
