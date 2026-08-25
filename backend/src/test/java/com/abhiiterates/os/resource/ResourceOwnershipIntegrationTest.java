package com.abhiiterates.os.resource;

import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.resource.dto.ResourceRequest;
import com.abhiiterates.os.user.UserRepository;
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
class ResourceOwnershipIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    private String userAToken;
    private String userBToken;
    private UUID userAResourceId;

    @BeforeEach
    void setUp() throws Exception {
        // Register and login User A
        String idA = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerA = RegisterRequest.builder()
                .email("userA_" + idA + "@example.com")
                .username("userA_" + idA)
                .password("Password123!")
                .firstName("User")
                .lastName("A")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerA)))
                .andExpect(status().isCreated());

        MvcResult loginAResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder()
                        .email(registerA.getEmail())
                        .password("Password123!")
                        .build())))
                .andExpect(status().isOk())
                .andReturn();

        userAToken = objectMapper.readTree(loginAResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Register and login User B
        String idB = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerB = RegisterRequest.builder()
                .email("userB_" + idB + "@example.com")
                .username("userB_" + idB)
                .password("Password123!")
                .firstName("User")
                .lastName("B")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerB)))
                .andExpect(status().isCreated());

        MvcResult loginBResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(LoginRequest.builder()
                        .email(registerB.getEmail())
                        .password("Password123!")
                        .build())))
                .andExpect(status().isOk())
                .andReturn();

        userBToken = objectMapper.readTree(loginBResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Create Resource for User A
        ResourceRequest createRequest = ResourceRequest.builder()
                .title("User A Confidential Notes")
                .description("Private content")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .starred(true)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/resources")
                .header("Authorization", "Bearer " + userAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String resIdStr = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();
        userAResourceId = UUID.fromString(resIdStr);
    }

    @Test
    void getResource_byOwner_returnsResource() throws Exception {
        mockMvc.perform(get("/api/v1/resources/" + userAResourceId)
                .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("User A Confidential Notes")));
    }

    @Test
    void getResource_byNonOwner_returnsNotFoundToPreventIdor() throws Exception {
        mockMvc.perform(get("/api/v1/resources/" + userAResourceId)
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void updateResource_byNonOwner_returnsNotFound() throws Exception {
        ResourceRequest updateRequest = ResourceRequest.builder()
                .title("Hacked Title")
                .description("Tampered")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.LOW)
                .status(ResourceStatus.ACTIVE)
                .build();

        mockMvc.perform(put("/api/v1/resources/" + userAResourceId)
                .header("Authorization", "Bearer " + userBToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteResource_byNonOwner_returnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/resources/" + userAResourceId)
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());

        // Verify resource still exists in DB
        assertThat(resourceRepository.existsById(userAResourceId)).isTrue();
    }

    @Test
    void archiveResource_byNonOwner_returnsNotFound() throws Exception {
        mockMvc.perform(patch("/api/v1/resources/" + userAResourceId + "/archive")
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void toggleStarResource_byNonOwner_returnsNotFound() throws Exception {
        mockMvc.perform(patch("/api/v1/resources/" + userAResourceId + "/star")
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void listResources_userB_doesNotSeeUserAResources() throws Exception {
        mockMvc.perform(get("/api/v1/resources")
                .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }
}
