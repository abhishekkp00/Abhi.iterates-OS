package com.abhiiterates.os.ai;

import com.abhiiterates.os.ai.dto.ChatRequest;
import com.abhiiterates.os.ai.dto.CreateConversationRequest;
import com.abhiiterates.os.ai.dto.UpdateConversationTitleRequest;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiConversationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AiConversationRepository conversationRepository;

    private String userAToken;
    private String userBToken;
    private UUID userAConversationId;

    @BeforeEach
    void setUp() throws Exception {
        // Register & Login User A
        String idA = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regA = RegisterRequest.builder()
                .email("ai_userA_" + idA + "@example.com")
                .username("ai_userA_" + idA)
                .password("Password123!")
                .firstName("AI")
                .lastName("UserA")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated());

        MvcResult loginA = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder()
                        .email(regA.getEmail())
                        .password("Password123!")
                        .build())))
                .andExpect(status().isOk())
                .andReturn();

        userAToken = objectMapper.readTree(loginA.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Register & Login User B
        String idB = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest regB = RegisterRequest.builder()
                .email("ai_userB_" + idB + "@example.com")
                .username("ai_userB_" + idB)
                .password("Password123!")
                .firstName("AI")
                .lastName("UserB")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated());

        MvcResult loginB = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder()
                        .email(regB.getEmail())
                        .password("Password123!")
                        .build())))
                .andExpect(status().isOk())
                .andReturn();

        userBToken = objectMapper.readTree(loginB.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Create AI Conversation for User A
        CreateConversationRequest createReq = new CreateConversationRequest("User A Research Chat");
        MvcResult convResult = mockMvc.perform(post("/api/v1/ai/conversations")
                .header("Authorization", "Bearer " + userAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String convIdStr = objectMapper.readTree(convResult.getResponse().getContentAsString())
                .path("data").path("id").asText();
        userAConversationId = UUID.fromString(convIdStr);
    }

    @Test
    void getConversation_byOwner_returnsConversationDetails() throws Exception {
        mockMvc.perform(get("/api/v1/ai/conversations/" + userAConversationId)
                .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("User A Research Chat")));
    }

    @Test
    void getConversation_byNonOwner_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/ai/conversations/" + userAConversationId)
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void updateTitle_byNonOwner_returnsNotFound() throws Exception {
        UpdateConversationTitleRequest updateReq = new UpdateConversationTitleRequest("Hacked Title");

        mockMvc.perform(patch("/api/v1/ai/conversations/" + userAConversationId + "/title")
                .header("Authorization", "Bearer " + userBToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteConversation_byNonOwner_returnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/ai/conversations/" + userAConversationId)
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());

        // Verify conversation still exists in DB
        assertThat(conversationRepository.existsById(userAConversationId)).isTrue();
    }

    @Test
    void listConversations_userB_doesNotSeeUserAConversation() throws Exception {
        mockMvc.perform(get("/api/v1/ai/conversations")
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    @Test
    void chat_withNonOwnerConversationId_createsNewConversationInsteadOfAppendingToUserA() throws Exception {
        ChatRequest chatReq = new ChatRequest(
                userAConversationId.toString(),
                "Infiltrating User A chat",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/ai/chat")
                .header("Authorization", "Bearer " + userBToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chatReq)))
                .andExpect(status().isNotFound());
    }
}
