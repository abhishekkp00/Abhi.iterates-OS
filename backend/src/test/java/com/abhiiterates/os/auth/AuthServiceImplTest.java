package com.abhiiterates.os.auth;

import com.abhiiterates.os.auth.dto.*;
import com.abhiiterates.os.config.JwtProperties;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.*;
import com.abhiiterates.os.user.dto.UserProfileDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserSessionRepository userSessionRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private JwtProperties jwtProperties;
    @Mock
    private UserMapper userMapper;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private Role userRole;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        userRole = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_USER")
                .description("Default User Role")
                .permissions(Collections.emptySet())
                .build();

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("student@example.com")
                .username("student123")
                .passwordHash("hashedPassword")
                .firstName("John")
                .lastName("Doe")
                .active(true)
                .roles(Collections.singleton(userRole))
                .build();

        registerRequest = RegisterRequest.builder()
                .email("student@example.com")
                .username("student123")
                .password("SecureP@ss123")
                .firstName("John")
                .lastName("Doe")
                .build();

        loginRequest = LoginRequest.builder()
                .email("student@example.com")
                .password("SecureP@ss123")
                .build();
    }

    @Test
    void registerUser_withValidRequest_savesAndReturnsUserProfile() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(userMapper.toUserProfileDto(testUser)).thenReturn(UserProfileDto.builder().email("student@example.com").build());

        UserProfileDto result = authService.registerUser(registerRequest);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("student@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_withDuplicateEmail_throwsBadRequestException() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerUser(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already registered with this email");

        verify(userRepository, never()).save(any());
    }

    @Test
    void registerUser_withDuplicateUsername_throwsBadRequestException() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerUser(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username is already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_withValidCredentials_returnsAuthResponse() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("mock.access.token");
        when(jwtProperties.getRefreshExpirationMs()).thenReturn(86400000L);
        when(jwtProperties.getExpirationMs()).thenReturn(900000L);
        when(userMapper.toUserProfileDto(testUser)).thenReturn(UserProfileDto.builder().email("student@example.com").build());

        AuthResponse response = authService.login(loginRequest, "127.0.0.1", "Mozilla/5.0");

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock.access.token");
        assertThat(response.getRefreshToken()).isNotBlank();
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        verify(userSessionRepository).save(any(UserSession.class));
    }

    @Test
    void login_withInvalidPassword_throwsBadCredentialsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_withDeactivatedUser_throwsBadRequestException() {
        testUser.setActive(false);
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

        assertThatThrownBy(() -> authService.login(loginRequest, "127.0.0.1", "Mozilla/5.0"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("currently deactivated");
    }

    @Test
    void refresh_withValidToken_rotatesRefreshToken() {
        RefreshToken oldToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("old-refresh-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(3600))
                .revoked(false)
                .build();

        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("old-refresh-token").build();

        when(refreshTokenRepository.findByToken("old-refresh-token")).thenReturn(Optional.of(oldToken));
        when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("new.access.token");
        when(jwtProperties.getRefreshExpirationMs()).thenReturn(86400000L);
        when(jwtProperties.getExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.refresh(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new.access.token");
        assertThat(response.getRefreshToken()).isNotEqualTo("old-refresh-token");
        assertThat(oldToken.isRevoked()).isTrue();
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void refresh_withRevokedToken_revokesAllUserTokensAndThrowsSecurityException() {
        RefreshToken revokedToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("revoked-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(3600))
                .revoked(true)
                .build();

        RefreshToken activeToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("active-token")
                .user(testUser)
                .revoked(false)
                .build();

        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("revoked-token").build();

        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(revokedToken));
        when(refreshTokenRepository.findByUserAndRevokedFalse(testUser)).thenReturn(List.of(activeToken));

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Security Breach Warning");

        assertThat(activeToken.isRevoked()).isTrue();
        verify(refreshTokenRepository).saveAll(anyList());
    }

    @Test
    void refresh_withExpiredToken_throwsBadRequestException() {
        RefreshToken expiredToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("expired-token")
                .user(testUser)
                .expiryDate(Instant.now().minusSeconds(3600))
                .revoked(false)
                .build();

        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("expired-token").build();

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Refresh token has expired");
    }

    @Test
    void logout_withValidRefreshToken_revokesToken() {
        RefreshToken token = RefreshToken.builder()
                .id(UUID.randomUUID())
                .token("valid-refresh-token")
                .user(testUser)
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(token));

        authService.logout("valid-refresh-token");

        assertThat(token.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    void getCurrentUser_withExistingEmail_returnsProfile() {
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(testUser));
        when(userMapper.toUserProfileDto(testUser)).thenReturn(UserProfileDto.builder().email("student@example.com").build());

        UserProfileDto dto = authService.getCurrentUser("student@example.com");

        assertThat(dto).isNotNull();
        assertThat(dto.getEmail()).isEqualTo("student@example.com");
    }

    @Test
    void getCurrentUser_withNonExistentEmail_throwsResourceNotFoundException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser("unknown@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
