package com.abhiiterates.os.admin;

import com.abhiiterates.os.admin.dto.SystemSettingsDto;
import com.abhiiterates.os.admin.dto.UpdateRolesRequest;
import com.abhiiterates.os.common.UserTestFactory;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private User regularUser;
    private User adminUser;
    private User superAdminUser;

    @BeforeEach
    void setUp() {
        Role roleUser = roleRepository.findByName("ROLE_USER").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));
        Role roleAdmin = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));
        Role roleSuperAdmin = roleRepository.findByName("ROLE_SUPER_ADMIN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_SUPER_ADMIN").build()));

        regularUser = UserTestFactory.createRegularUser("secRegular");
        regularUser.setRoles(Set.of(roleUser));
        regularUser = userRepository.save(regularUser);

        adminUser = UserTestFactory.createRegularUser("secAdmin");
        adminUser.setRoles(Set.of(roleAdmin));
        adminUser = userRepository.save(adminUser);

        superAdminUser = UserTestFactory.createRegularUser("secSuperAdmin");
        superAdminUser.setRoles(Set.of(roleSuperAdmin));
        superAdminUser = userRepository.save(superAdminUser);
    }

    @Test
    @DisplayName("Admin Security: Unauthenticated request returns 401 Unauthorized")
    void testUnauthenticatedAccess_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "secRegular", roles = {"USER"})
    @DisplayName("Admin Security: USER role receives 403 Forbidden on all Admin endpoints")
    void testUserRoleAccess_returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/resources"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/marketplace"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "secCreator", roles = {"CREATOR"})
    @DisplayName("Admin Security: CREATOR role receives 403 Forbidden on Admin endpoints")
    void testCreatorRoleAccess_returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "secAdmin", roles = {"ADMIN"})
    @DisplayName("Admin Security: ADMIN role allowed on standard operations, denied on reserved SUPER_ADMIN settings PUT")
    void testAdminRoleAccess_allowedForStandard_deniedForReserved() throws Exception {
        // Standard ADMIN GET endpoints -> 200 OK
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isOk());

        // PUT System Settings -> Reserved for SUPER_ADMIN -> 403 Forbidden for ADMIN
        SystemSettingsDto settingsDto = SystemSettingsDto.builder()
                .maintenanceMode(false)
                .enableAiAssistant(true)
                .marketplaceAutoApprove(true)
                .maxTokensPerSession(3000)
                .apiKeyConfig("test-key")
                .build();

        mockMvc.perform(put("/api/v1/admin/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settingsDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "secAdmin", roles = {"ADMIN"})
    @DisplayName("Admin Security: Ordinary ADMIN cannot assign ROLE_SUPER_ADMIN (Privilege Escalation Guard)")
    void testPrivilegeEscalation_ordinaryAdminCannotGrantSuperAdminRole() throws Exception {
        UpdateRolesRequest req = new UpdateRolesRequest(List.of("ROLE_USER", "ROLE_SUPER_ADMIN"));

        mockMvc.perform(put("/api/v1/admin/users/" + regularUser.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Forbidden: Only SUPER_ADMIN can assign or alter SUPER_ADMIN roles."));
    }

    @Test
    @WithMockUser(username = "secSuperAdmin", roles = {"SUPER_ADMIN"})
    @DisplayName("Admin Security: SUPER_ADMIN allowed on reserved settings PUT and role escalation")
    void testSuperAdminRoleAccess_allowedForReservedOperations() throws Exception {
        SystemSettingsDto settingsDto = SystemSettingsDto.builder()
                .maintenanceMode(false)
                .enableAiAssistant(true)
                .marketplaceAutoApprove(true)
                .maxTokensPerSession(5000)
                .apiKeyConfig("super-key")
                .build();

        mockMvc.perform(put("/api/v1/admin/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(settingsDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // SUPER_ADMIN assigning SUPER_ADMIN role -> 200 OK
        UpdateRolesRequest req = new UpdateRolesRequest(List.of("ROLE_USER", "ROLE_SUPER_ADMIN"));
        mockMvc.perform(put("/api/v1/admin/users/" + regularUser.getId() + "/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Verify Audit Log generated
        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).isNotEmpty();
        assertThat(logs.stream().anyMatch(l -> l.getAction().equals("UPDATE_SYSTEM_SETTINGS"))).isTrue();
    }
}
