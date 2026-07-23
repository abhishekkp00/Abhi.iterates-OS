package com.abhiiterates.os.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Custom OAuth2 Authentication Failure Handler.
 * Logs exact failure reasons when Google OAuth fails and redirects user back to frontend SPA.
 */
@Component
@Slf4j
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${cors.allowed-origins:http://localhost:5180}")
    private String allowedOrigins;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {

        log.error("Google OAuth2 Authentication Failed: {}", exception.getMessage(), exception);

        String redirectOrigin = allowedOrigins.split(",")[0].trim();
        String targetUrl = UriComponentsBuilder.fromUriString(redirectOrigin + "/login")
                .queryParam("error", exception.getLocalizedMessage())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
