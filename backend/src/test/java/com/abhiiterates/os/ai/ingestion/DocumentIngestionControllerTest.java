package com.abhiiterates.os.ai.ingestion;

import com.abhiiterates.os.ai.ingestion.domain.IngestionStatus;
import com.abhiiterates.os.ai.ingestion.dto.IngestionResponse;
import com.abhiiterates.os.ai.ingestion.service.DocumentIngestionService;
import com.abhiiterates.os.auth.AuthService;
import com.abhiiterates.os.auth.dto.AuthResponse;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.user.dto.UserProfileDto;
import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.resource.Resource;
import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceRepository;
import com.abhiiterates.os.resource.ResourceStatus;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentIngestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @MockBean
    private DocumentIngestionService ingestionService;

    @MockBean
    private com.abhiiterates.os.ai.embedding.service.DocumentEmbeddingService embeddingService;

    private String userToken;
    private User testUser;
    private Resource testResource;
    private UUID attachmentId;

    @BeforeEach
    void setUp() {
        String email = "ingest_user_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        UserProfileDto userResp = authService.registerUser(RegisterRequest.builder()
                .email(email)
                .username("ingest_" + UUID.randomUUID().toString().substring(0, 8))
                .password("Password123!")
                .firstName("Ingest")
                .lastName("User")
                .build());
        testUser = userRepository.findById(userResp.getId()).orElseThrow();

        AuthResponse authResp = authService.login(new LoginRequest(email, "Password123!"), "127.0.0.1", "MockMvcTest");
        userToken = authResp.getAccessToken();

        testResource = resourceRepository.save(Resource.builder()
                .title("Operating Systems")
                .description("Study Material")
                .category(ResourceCategory.BOOK)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(testUser)
                .build());

        attachmentId = UUID.randomUUID();
    }

    @Test
    @DisplayName("ingestAttachment_withValidToken_returnsIngestionResponse")
    void ingestAttachment_withValidToken_returnsIngestionResponse() throws Exception {
        IngestionResponse mockResponse = IngestionResponse.builder()
                .documentId(UUID.randomUUID())
                .resourceId(testResource.getId())
                .attachmentId(attachmentId)
                .fileName("syllabus.pdf")
                .contentType("application/pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.PENDING)
                .contentHash("hash123")
                .pageCount(5)
                .extractedCharCount(1500L)
                .chunkCount(2)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .chunks(Collections.emptyList())
                .build();

        when(ingestionService.ingestAttachment(eq(testResource.getId()), eq(attachmentId), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/resources/" + testResource.getId() + "/attachments/" + attachmentId + "/ingest")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.pageCount").value(5))
                .andExpect(jsonPath("$.chunkCount").value(2));
    }

    @Test
    @DisplayName("generateEmbeddings_withValidToken_returnsStatusMetadataWithoutExposingRawVectors")
    void generateEmbeddings_withValidToken_returnsStatusMetadataWithoutExposingRawVectors() throws Exception {
        IngestionResponse mockResponse = IngestionResponse.builder()
                .documentId(UUID.randomUUID())
                .resourceId(testResource.getId())
                .attachmentId(attachmentId)
                .fileName("syllabus.pdf")
                .status(IngestionStatus.COMPLETED)
                .embeddingStatus(IngestionStatus.COMPLETED)
                .pageCount(5)
                .chunkCount(2)
                .build();

        when(embeddingService.generateEmbeddingsForDocument(eq(testResource.getId()), eq(attachmentId), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/resources/" + testResource.getId() + "/attachments/" + attachmentId + "/ingest/embed")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.embeddingStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.vector").doesNotExist())
                .andExpect(jsonPath("$.embedding").doesNotExist());
    }

    @Test
    @DisplayName("getIngestionStatus_withValidToken_returnsStatus")
    void getIngestionStatus_withValidToken_returnsStatus() throws Exception {
        IngestionResponse mockResponse = IngestionResponse.builder()
                .documentId(UUID.randomUUID())
                .resourceId(testResource.getId())
                .attachmentId(attachmentId)
                .fileName("syllabus.pdf")
                .status(IngestionStatus.PROCESSING)
                .embeddingStatus(IngestionStatus.PENDING)
                .pageCount(0)
                .chunkCount(0)
                .build();

        when(ingestionService.getIngestionStatus(eq(testResource.getId()), eq(attachmentId), any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/resources/" + testResource.getId() + "/attachments/" + attachmentId + "/ingest/status")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"))
                .andExpect(jsonPath("$.embeddingStatus").value("PENDING"));
    }
}
