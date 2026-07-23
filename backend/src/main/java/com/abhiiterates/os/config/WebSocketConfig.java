package com.abhiiterates.os.config;

import com.abhiiterates.os.auth.JwtTokenProvider;
import com.abhiiterates.os.user.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * WebSocketConfig — Configures STOMP messaging and SockJS endpoints.
 *
 * Implements JWT authentication interceptor on the inbound client channel
 * to authorize connections before WebSocket connection establishment.
 */
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix for server-to-client subscriptions
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Prefix for client-to-server destination mappings
        config.setApplicationDestinationPrefixes("/app");
        
        // User destination prefix for private messaging (/user/{username}/queue/...)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Primary STOMP WebSocket connection path
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:5173")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    
                    if (authorization != null && !authorization.isEmpty()) {
                        String bearerToken = authorization.get(0);
                        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                            String jwt = bearerToken.substring(7);
                            
                            try {
                                if (jwtTokenProvider.validateToken(jwt)) {
                                    String email = jwtTokenProvider.extractEmail(jwt);
                                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                                    
                                    if (userDetails.isEnabled()) {
                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(
                                                        userDetails, null, userDetails.getAuthorities()
                                                );
                                        accessor.setUser(authentication);
                                        log.info("WebSocket connection authenticated for user: {}", email);
                                    }
                                }
                            } catch (Exception ex) {
                                log.error("Failed to authenticate WebSocket connection", ex);
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}
