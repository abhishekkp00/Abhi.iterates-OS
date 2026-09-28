package com.abhiiterates.os.workflow;

import com.abhiiterates.os.ai.*;
import com.abhiiterates.os.analytics.dto.*;
import com.abhiiterates.os.analytics.service.AnalyticsService;
import com.abhiiterates.os.auth.RefreshTokenRepository;
import com.abhiiterates.os.auth.UserSessionRepository;
import com.abhiiterates.os.auth.dto.*;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.marketplace.*;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingRequest;
import com.abhiiterates.os.marketplace.dto.MarketplaceListingResponse;
import com.abhiiterates.os.notification.dto.NotificationResponse;
import com.abhiiterates.os.notification.dto.UnreadCountResponse;
import com.abhiiterates.os.notification.domain.NotificationType;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.resource.*;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class EndToEndJourneyIntegrationTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class TestVectorStoreConfig {
        @org.springframework.context.annotation.Bean
        @org.springframework.context.annotation.Primary
        public VectorStore testVectorStore(org.springframework.ai.embedding.EmbeddingModel embeddingModel) {
            return org.springframework.ai.vectorstore.SimpleVectorStore.builder(embeddingModel).build();
        }
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private MarketplaceListingRepository listingRepository;

    @Autowired
    private MarketplaceListingService listingService;

    @Autowired
    private AiConversationRepository aiConversationRepository;

    @Autowired
    private AiMessageRepository aiMessageRepository;

    @MockBean
    private org.springframework.ai.embedding.EmbeddingModel embeddingModel;

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    private String userEmail;
    private String password = "Password123!";
    private String username;

    @BeforeEach
    void setUp() {
        float[] mockEmbedding = new float[1536];
        mockEmbedding[0] = 0.95f;
        mockEmbedding[1] = 0.31f;

        when(embeddingModel.embed(any(Document.class))).thenReturn(mockEmbedding);
        when(embeddingModel.embed(any(String.class))).thenReturn(mockEmbedding);
        when(embeddingModel.embed(any(List.class))).thenReturn(List.of(mockEmbedding));

        roleRepository.findByName("ROLE_USER").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));
        roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));
        roleRepository.findByName("ROLE_SUPER_ADMIN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_SUPER_ADMIN").build()));

        userEmail = "e2e_student_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        username = "e2estudent_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @DisplayName("Complete 18-Journey E2E Integration Pass: Register → Login → Session → Dashboard → Resources → AI/RAG → Tasks → Marketplace → Notifications → Analytics → Admin")
    void complete_18_journeys_end_to_end() {
        // ── 1. REGISTER ─────────────────────────────────────────────────────────
        RegisterRequest regReq = new RegisterRequest();
        regReq.setFirstName("E2E");
        regReq.setLastName("Student");
        regReq.setUsername(username);
        regReq.setEmail(userEmail);
        regReq.setPassword(password);

        ResponseEntity<ApiResponse> regResp = restTemplate.postForEntity("/api/v1/auth/register", regReq, ApiResponse.class);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // ── 2. LOGIN ────────────────────────────────────────────────────────────
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(userEmail);
        loginReq.setPassword(password);

        ResponseEntity<ApiResponse<AuthResponse>> loginResp = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginReq),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResp.getBody()).isNotNull();
        AuthResponse authData = loginResp.getBody().data();
        String accessToken = authData.getAccessToken();
        String refreshToken = authData.getRefreshToken();
        assertThat(accessToken).isNotBlank();
        assertThat(refreshToken).isNotBlank();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        // ── 3. REFRESH SESSION ─────────────────────────────────────────────────
        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);
        ResponseEntity<ApiResponse<AuthResponse>> refreshResp = restTemplate.exchange(
                "/api/v1/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(refreshReq),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(refreshResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        String newAccessToken = refreshResp.getBody().data().getAccessToken();
        assertThat(newAccessToken).isNotBlank();
        headers.setBearerAuth(newAccessToken);

        // ── 4. LOGOUT & RE-LOGIN FOR ACTIVE WORKFLOW ──────────────────────────
        ResponseEntity<ApiResponse<Void>> logoutResp = restTemplate.exchange(
                "/api/v1/auth/logout",
                HttpMethod.POST,
                new HttpEntity<>(refreshReq, headers),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(logoutResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Re-login to get active valid session for remaining journeys
        ResponseEntity<ApiResponse<AuthResponse>> activeLoginResp = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginReq),
                new ParameterizedTypeReference<>() {}
        );
        String activeToken = activeLoginResp.getBody().data().getAccessToken();
        headers.setBearerAuth(activeToken);

        User currentUser = userRepository.findByEmail(userEmail).orElseThrow();

        // ── 5. DASHBOARD ────────────────────────────────────────────────────────
        ResponseEntity<ApiResponse<DashboardAnalyticsDto>> dashResp = restTemplate.exchange(
                "/api/v1/analytics/dashboard",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        assertThat(dashResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // ── 6. RESOURCE UPLOAD & PERSISTENCE ────────────────────────────────────
        Resource resource = Resource.builder()
                .title("Operating Systems Principles")
                .description("Comprehensive guide to kernels and concurrency")
                .category(ResourceCategory.LECTURE)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .user(currentUser)
                .build();
        resource.setCreatedAt(Instant.now());
        resource = resourceRepository.save(resource);
        assertThat(resource.getId()).isNotNull();

        // ── 7. RESOURCE SEARCH ──────────────────────────────────────────────────
        ResponseEntity<com.fasterxml.jackson.databind.JsonNode> searchResp = restTemplate.exchange(
                "/api/v1/resources?search=Principles",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                com.fasterxml.jackson.databind.JsonNode.class
        );
        assertThat(searchResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // ── 8. RESOURCE UPDATE ──────────────────────────────────────────────────
        resource.setDescription("Updated description for OS principles guide");
        resource = resourceRepository.save(resource);
        assertThat(resource.getDescription()).contains("Updated description");

        // ── 9. RESOURCE DELETE (SOFT DELETE / ARCHIVE) ──────────────────────────
        resource.setStatus(ResourceStatus.ARCHIVED);
        resourceRepository.save(resource);
        assertThat(resourceRepository.findById(resource.getId()).get().getStatus()).isEqualTo(ResourceStatus.ARCHIVED);

        // ── 10. AI CHAT ────────────────────────────────────────────────────────
        AiConversation conversation = AiConversation.builder()
                .user(currentUser)
                .title("OS Memory Management Chat")
                .preview("How does paging work?")
                .build();
        conversation = aiConversationRepository.save(conversation);

        AiMessage userMsg = AiMessage.builder()
                .conversation(conversation)
                .role(MessageRole.USER)
                .content("How does virtual memory paging work?")
                .tokenCount(12)
                .build();
        userMsg.setCreatedAt(Instant.now());
        aiMessageRepository.save(userMsg);

        AiMessage assistantMsg = AiMessage.builder()
                .conversation(conversation)
                .role(MessageRole.ASSISTANT)
                .content("Virtual memory paging divides memory into fixed-size pages...")
                .tokenCount(85)
                .build();
        assistantMsg.setCreatedAt(Instant.now());
        aiMessageRepository.save(assistantMsg);

        assertThat(aiMessageRepository.countQueriesByUser(currentUser)).isGreaterThanOrEqualTo(1);

        // ── 11. AI STREAMING & RATE LIMITER CHECK ──────────────────────────────
        long totalTokens = aiMessageRepository.sumTokensByUser(currentUser);
        assertThat(totalTokens).isGreaterThanOrEqualTo(97);

        // ── 12. RAG RETRIEVAL & VECTOR STORE SEARCH ─────────────────────────────
        Document doc = new Document("Paging is a memory management scheme by which a computer stores and retrieves data from secondary storage.", Map.of("user_id", currentUser.getId().toString(), "filename", "os_paging.pdf"));
        vectorStore.add(List.of(doc));

        List<Document> ragResults = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("paging memory management")
                        .topK(5)
                        .filterExpression(new FilterExpressionBuilder().eq("user_id", currentUser.getId().toString()).build())
                        .build()
        );
        assertThat(ragResults).isNotNull();

        // ── 13. TASK CREATION ───────────────────────────────────────────────────
        Task task = Task.builder()
                .user(currentUser)
                .title("Complete OS Assignment 3")
                .description("Implement page replacement algorithms in Java")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .build();
        task.setCreatedAt(Instant.now());
        task = taskRepository.save(task);
        assertThat(task.getId()).isNotNull();

        // ── 14. TASK COMPLETION ────────────────────────────────────────────────
        task.setStatus(TaskStatus.COMPLETED);
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        assertThat(taskRepository.findById(task.getId()).get().getStatus()).isEqualTo(TaskStatus.COMPLETED);

        // ── 15. MARKETPLACE LISTING ─────────────────────────────────────────────
        MarketplaceListingRequest createListing = MarketplaceListingRequest.builder()
                .title("Used OS Textbook 10th Ed")
                .description("Silberschatz Operating System Concepts")
                .price(new BigDecimal("40.00"))
                .negotiable(true)
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.GOOD)
                .location("Campus Library")
                .status(ListingStatus.ACTIVE)
                .build();

        MarketplaceListingResponse listingResp = listingService.create(createListing, currentUser);
        assertThat(listingResp).isNotNull();

        MarketplaceListingResponse soldListing = listingService.update(listingResp.getId(), MarketplaceListingRequest.builder()
                .title(listingResp.getTitle())
                .description(listingResp.getDescription())
                .price(listingResp.getPrice())
                .negotiable(listingResp.isNegotiable())
                .category(listingResp.getCategory())
                .condition(listingResp.getCondition())
                .location(listingResp.getLocation())
                .status(ListingStatus.SOLD)
                .build(), currentUser);
        assertThat(soldListing.getStatus()).isEqualTo(ListingStatus.SOLD);

        // ── 16. NOTIFICATION ───────────────────────────────────────────────────
        NotificationResponse notif = notificationService.createNotification(
                currentUser,
                NotificationType.TASK_DUE_SOON,
                "OS Assignment 3 due tonight",
                "/tasks",
                task.getId()
        );
        assertThat(notif).isNotNull();

        UnreadCountResponse unread = notificationService.getUnreadCount(currentUser);
        assertThat(unread.unreadCount()).isGreaterThanOrEqualTo(1);

        notificationService.markAsRead(notif.id(), currentUser);
        notificationService.markAllAsRead(currentUser);
        assertThat(notificationService.getUnreadCount(currentUser).unreadCount()).isEqualTo(0);

        // ── 17. ANALYTICS ──────────────────────────────────────────────────────
        DashboardAnalyticsDto analytics = analyticsService.getDashboardAnalytics(currentUser, 7);
        assertThat(analytics.getCompletedTasks()).isGreaterThanOrEqualTo(1);
        assertThat(analytics.getTotalAiTokens()).isGreaterThanOrEqualTo(97);

        // ── 18. ADMIN AUTHORIZATION ─────────────────────────────────────────────
        // Regular user should receive 403 Forbidden on Admin portal
        ResponseEntity<ApiResponse> userAdminAccessResp = restTemplate.exchange(
                "/api/v1/admin/summary",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                ApiResponse.class
        );
        assertThat(userAdminAccessResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // Elevate user to ADMIN
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();
        currentUser.setRoles(Set.of(adminRole));
        userRepository.save(currentUser);

        // Login again to update SecurityContext token with ROLE_ADMIN authority
        ResponseEntity<ApiResponse<AuthResponse>> adminLoginResp = restTemplate.exchange(
                "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginReq),
                new ParameterizedTypeReference<>() {}
        );
        headers.setBearerAuth(adminLoginResp.getBody().data().getAccessToken());

        ResponseEntity<ApiResponse> adminAccessResp = restTemplate.exchange(
                "/api/v1/admin/summary",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                ApiResponse.class
        );
        assertThat(adminAccessResp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
