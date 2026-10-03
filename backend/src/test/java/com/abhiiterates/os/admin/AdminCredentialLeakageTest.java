package com.abhiiterates.os.admin;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.marketplace.*;
import com.abhiiterates.os.resource.*;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminCredentialLeakageTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private MarketplaceListingRepository marketplaceListingRepository;

    private User studentUser;
    private static final String SECRET_PASSWORD_HASH = "$2a$10$TOPSECRETBCRYPTHASHNEVEREXPOSEINAPIRESPONSES123456";

    @BeforeEach
    void setUp() {
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        studentUser = User.builder()
                .email("student_leak_test_" + UUID.randomUUID() + "@university.edu")
                .username("student_leak_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(SECRET_PASSWORD_HASH)
                .firstName("Alice")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .roles(Set.of(userRole))
                .build();
        studentUser = userRepository.save(studentUser);
    }

    @Test
    @DisplayName("Security: Direct User entity Jackson serialization must NEVER expose passwordHash or password")
    void testDirectUserSerialization_doesNotExposePasswordHashOrPassword() throws Exception {
        String json = objectMapper.writeValueAsString(studentUser);

        assertThat(json).doesNotContain("passwordHash");
        assertThat(json).doesNotContain("password_hash");
        assertThat(json).doesNotContain("password");
        assertThat(json).doesNotContain(SECRET_PASSWORD_HASH);
        assertThat(json).contains(studentUser.getUsername());
        assertThat(json).contains(studentUser.getEmail());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    @DisplayName("Security: GET /api/v1/admin/resources must NEVER leak passwordHash, internal secrets, or cause recursion")
    void testAdminResources_doesNotLeakCredentialsOrTokens() throws Exception {
        Resource resource = Resource.builder()
                .title("Algorithms Cheat Sheet")
                .description("Comprehensive tree and graph algorithms")
                .category(ResourceCategory.CHEATSHEET)
                .priority(ResourcePriority.HIGH)
                .status(ResourceStatus.ACTIVE)
                .deadline(Instant.now().plusSeconds(86400))
                .tags("dsa,graphs")
                .starred(true)
                .user(studentUser)
                .attachments(new ArrayList<>())
                .build();

        ResourceAttachment attachment = ResourceAttachment.builder()
                .fileName("graphs.pdf")
                .fileSize(1024L)
                .contentType("application/pdf")
                .downloadUrl("https://storage.university.edu/graphs.pdf")
                .resource(resource)
                .build();

        resource.getAttachments().add(attachment);
        resourceRepository.save(resource);

        MvcResult result = mockMvc.perform(get("/api/v1/admin/resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();

        // Regression guard: ensure passwordHash or password NEVER appears anywhere in the response
        assertThat(rawJson).doesNotContain("passwordHash");
        assertThat(rawJson).doesNotContain("password_hash");
        assertThat(rawJson).doesNotContain(SECRET_PASSWORD_HASH);
        assertThat(rawJson).doesNotContain("refreshToken");
        assertThat(rawJson).doesNotContain("refresh_token");

        // UI contract verification: attachments provide fileUrl and fileName, creator is represented cleanly
        assertThat(rawJson).contains("graphs.pdf");
        assertThat(rawJson).contains("fileUrl");
        assertThat(rawJson).contains("creatorUsername");
        assertThat(rawJson).contains(studentUser.getUsername());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    @DisplayName("Security: GET /api/v1/admin/marketplace must NEVER leak seller passwordHash or cause circular serialization")
    void testAdminMarketplace_doesNotLeakSellerCredentialsOrTokens() throws Exception {
        MarketplaceListing listing = MarketplaceListing.builder()
                .title("Calculus 8th Edition Textbook")
                .description("Hardcover in pristine condition")
                .price(new BigDecimal("45.00"))
                .negotiable(true)
                .category(ListingCategory.BOOKS)
                .condition(ListingCondition.LIKE_NEW)
                .location("North Campus Library")
                .status(ListingStatus.ACTIVE)
                .tags("math,calculus")
                .seller(studentUser)
                .images(new ArrayList<>())
                .build();

        ListingImage image = ListingImage.builder()
                .imageUrl("https://storage.university.edu/book_front.jpg")
                .isPrimary(true)
                .listing(listing)
                .build();

        listing.getImages().add(image);
        marketplaceListingRepository.save(listing);

        MvcResult result = mockMvc.perform(get("/api/v1/admin/marketplace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();

        // Regression guard: ensure passwordHash or password NEVER appears anywhere in the response
        assertThat(rawJson).doesNotContain("passwordHash");
        assertThat(rawJson).doesNotContain("password_hash");
        assertThat(rawJson).doesNotContain(SECRET_PASSWORD_HASH);
        assertThat(rawJson).doesNotContain("refreshToken");
        assertThat(rawJson).doesNotContain("refresh_token");

        // UI contract verification: seller username is exposed for display, images are present without recursion
        assertThat(rawJson).contains("seller");
        assertThat(rawJson).contains(studentUser.getUsername());
        assertThat(rawJson).contains("https://storage.university.edu/book_front.jpg");
    }

    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    @DisplayName("Security: GET /api/v1/admin/users must NEVER expose passwordHash in paginated responses")
    void testAdminUsers_doesNotLeakPasswordHash() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();

        assertThat(rawJson).doesNotContain("passwordHash");
        assertThat(rawJson).doesNotContain("password_hash");
        assertThat(rawJson).doesNotContain(SECRET_PASSWORD_HASH);
    }

    @Test
    @DisplayName("Security: ResourceAttachment must NOT recursively serialize parent Resource")
    void testResourceAttachment_doesNotRecursivelySerializeResource() throws Exception {
        Resource resource = Resource.builder()
                .id(UUID.randomUUID())
                .title("Parent Resource")
                .build();

        ResourceAttachment attachment = ResourceAttachment.builder()
                .id(UUID.randomUUID())
                .fileName("doc.pdf")
                .downloadUrl("https://example.com/doc.pdf")
                .resource(resource)
                .build();

        String json = objectMapper.writeValueAsString(attachment);
        assertThat(json).doesNotContain("parent Resource");
        assertThat(json).doesNotContain("\"resource\":");
    }

    @Test
    @DisplayName("Security: ListingImage must NOT recursively serialize parent MarketplaceListing")
    void testListingImage_doesNotRecursivelySerializeListing() throws Exception {
        MarketplaceListing listing = MarketplaceListing.builder()
                .id(UUID.randomUUID())
                .title("Parent Listing")
                .build();

        ListingImage image = ListingImage.builder()
                .id(UUID.randomUUID())
                .imageUrl("https://example.com/pic.png")
                .listing(listing)
                .build();

        String json = objectMapper.writeValueAsString(image);
        assertThat(json).doesNotContain("parent Listing");
        assertThat(json).doesNotContain("\"listing\":");
    }
}
