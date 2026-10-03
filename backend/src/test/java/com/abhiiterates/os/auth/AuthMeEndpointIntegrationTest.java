package com.abhiiterates.os.auth;

import com.abhiiterates.os.auth.dto.LoginRequest;
import com.abhiiterates.os.auth.dto.RefreshTokenRequest;
import com.abhiiterates.os.auth.dto.RegisterRequest;
import com.abhiiterates.os.config.JwtProperties;
import com.abhiiterates.os.user.Role;
import com.abhiiterates.os.user.RoleRepository;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthMeEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JwtProperties jwtProperties;

    private User activeUser;
    private User inactiveUser;
    private User softDeletedUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        activeUser = User.builder()
                .email("active_student_" + UUID.randomUUID() + "@example.com")
                .username("active_student_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Active")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .softDeleted(false)
                .roles(Set.of(userRole))
                .build();
        activeUser = userRepository.save(activeUser);

        inactiveUser = User.builder()
                .email("inactive_student_" + UUID.randomUUID() + "@example.com")
                .username("inactive_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Inactive")
                .lastName("Student")
                .active(false)
                .emailVerified(true)
                .softDeleted(false)
                .roles(Set.of(userRole))
                .build();
        inactiveUser = userRepository.save(inactiveUser);

        softDeletedUser = User.builder()
                .email("deleted_student_" + UUID.randomUUID() + "@example.com")
                .username("deleted_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Deleted")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .softDeleted(true)
                .roles(Set.of(userRole))
                .build();
        softDeletedUser = userRepository.save(softDeletedUser);
    }

    private String generateExpiredToken(User user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiredDate = new Date(now.getTime() - 60000); // 1 minute in past

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList());

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(new Date(now.getTime() - 120000))
                .expiration(expiredDate)
                .signWith(key)
                .compact();
    }

    @Test
    @DisplayName("Auth /me: Request with NO token returns HTTP 401 Unauthorized, never 500")
    void testGetMe_noToken_returns401Unauthorized() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        assertThat(rawJson).doesNotContain("NullPointerException");
        assertThat(rawJson).doesNotContain("500");
    }

    @Test
    @DisplayName("Auth /me: Request with EXPIRED token returns HTTP 401 Unauthorized, never 500")
    void testGetMe_expiredToken_returns401Unauthorized() throws Exception {
        String expiredToken = generateExpiredToken(activeUser);

        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        assertThat(rawJson).doesNotContain("NullPointerException");
        assertThat(rawJson).doesNotContain("500");
    }

    @Test
    @DisplayName("Auth /me: Request with MALFORMED token returns HTTP 401 Unauthorized, never 500")
    void testGetMe_malformedToken_returns401Unauthorized() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer not.a.valid.jwt.payload.format"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        assertThat(rawJson).doesNotContain("NullPointerException");
        assertThat(rawJson).doesNotContain("500");
    }

    @Test
    @DisplayName("Auth /me: Request with VALID token returns 200 OK with own profile, no credentials leaked")
    void testGetMe_validToken_returnsOwnProfileWithoutCredentials() throws Exception {
        String validToken = jwtTokenProvider.generateAccessToken(activeUser);

        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is(activeUser.getEmail())))
                .andExpect(jsonPath("$.data.username", is(activeUser.getUsername())))
                .andExpect(jsonPath("$.data.firstName", is("Active")))
                .andExpect(jsonPath("$.data.lastName", is("Student")))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_USER")))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        // Strict credential protection checks
        assertThat(rawJson).doesNotContain("passwordHash");
        assertThat(rawJson).doesNotContain("password_hash");
        assertThat(rawJson).doesNotContain("\"password\":");
        assertThat(rawJson).doesNotContain("refreshToken");
        assertThat(rawJson).doesNotContain("refresh_token");
    }

    @Test
    @DisplayName("Auth /me: INACTIVE user with valid token returns HTTP 401 Unauthorized, never 500")
    void testGetMe_inactiveUser_returns401Unauthorized() throws Exception {
        String tokenForInactive = jwtTokenProvider.generateAccessToken(inactiveUser);

        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenForInactive))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        assertThat(rawJson).doesNotContain("NullPointerException");
        assertThat(rawJson).doesNotContain("500");
    }

    @Test
    @DisplayName("Auth /me: SOFT-DELETED user with valid token returns HTTP 401 Unauthorized, never 500")
    void testGetMe_softDeletedUser_returns401Unauthorized() throws Exception {
        String tokenForDeleted = jwtTokenProvider.generateAccessToken(softDeletedUser);

        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenForDeleted))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        assertThat(rawJson).doesNotContain("NullPointerException");
        assertThat(rawJson).doesNotContain("500");
    }

    @Test
    @DisplayName("Public Auth: /register, /login, /refresh, and /logout retain intended public access behavior")
    void testPublicAuthEndpoints_retainPublicAccess() throws Exception {
        // 1. /register is accessible publicly
        String unique = UUID.randomUUID().toString().substring(0, 8);
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("public_" + unique + "@example.com")
                .username("pub_" + unique)
                .password("Password123!")
                .firstName("Pub")
                .lastName("Lic")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        // 2. /login is accessible publicly
        LoginRequest loginReq = LoginRequest.builder()
                .email("public_" + unique + "@example.com")
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        String refreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("refreshToken").asText();

        // 3. /refresh is accessible publicly
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 4. /logout is accessible publicly
        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
