package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.CreateConversationRequest;
import com.abhiiterates.os.ai.dto.MessageResponse;
import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiChatService aiChatService;

    @Autowired
    private AiRateLimiterService rateLimiterService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = UserTestFactory.createRegularUser("chatCtrlUser");
    }

    @Test
    void chat_withValidRequest_returnsMessageResponseAndRateLimitHeaders() throws Exception {
        ChatRequest request = new ChatRequest(null, "Explain recursion in CS", null, null);
        MessageResponse response = MessageResponse.builder()
                .id(UUID.randomUUID())
                .role(MessageRole.ASSISTANT)
                .content("Recursion is a programming technique where a function calls itself...")
                .createdAt(Instant.now())
                .build();

        when(aiChatService.chat(any(ChatRequest.class), any(User.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-RateLimit-Limit"))
                .andExpect(header().exists("X-RateLimit-Remaining"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Recursion is a programming technique where a function calls itself..."));
    }

    @Test
    void streamChat_withValidRequest_returnsSseEmitter() throws Exception {
        ChatRequest request = new ChatRequest(null, "Explain arrays", null, null);
        SseEmitter emitter = new SseEmitter();

        when(aiChatService.streamChat(any(ChatRequest.class), any(User.class))).thenReturn(emitter);

        mockMvc.perform(post("/api/v1/ai/chat/stream")
                .accept(MediaType.TEXT_EVENT_STREAM, MediaType.APPLICATION_JSON)
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(request().asyncStarted());
    }

    @Test
    void chat_whenRateLimitExceeded_returns429TooManyRequests() throws Exception {
        ChatRequest request = new ChatRequest(null, "Overload prompt", null, null);
        MessageResponse response = MessageResponse.builder()
                .id(UUID.randomUUID())
                .role(MessageRole.ASSISTANT)
                .content("ok")
                .createdAt(Instant.now())
                .build();

        when(aiChatService.chat(any(ChatRequest.class), any(User.class))).thenReturn(response);

        // Consume all chat tokens (20) for testUser
        for (int i = 0; i < 20; i++) {
            rateLimiterService.tryConsumeChatToken(testUser.getId(), false);
        }

        // 21st request must be rate limited with HTTP 429
        mockMvc.perform(post("/api/v1/ai/chat")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("AI chat rate limit exceeded. Please wait before sending another request."));
    }

    @Test
    void createConversation_withValidRequest_returns21Created() throws Exception {
        CreateConversationRequest request = new CreateConversationRequest("Algorithms Study");

        mockMvc.perform(post("/api/v1/ai/conversations")
                .with(user(testUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void chat_withoutAuthentication_returnsUnauthorized() throws Exception {
        ChatRequest request = new ChatRequest(null, "Unauthenticated question", null, null);

        mockMvc.perform(post("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
