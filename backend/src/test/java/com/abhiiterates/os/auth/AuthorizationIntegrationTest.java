package com.abhiiterates.os.auth;

import com.abhiiterates.os.admin.controller.AdminController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @SpyBean
    private AdminController adminController;

    @Test
    void adminEndpoint_accessedByUnauthenticatedUser_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isUnauthorized());

        verify(adminController, never()).getAdminSummary(any());
    }

    @Test
    @WithMockUser(username = "student", roles = {"USER"})
    void adminEndpoint_accessedByRegularUser_returnsForbiddenAndNeverExecutesMethod() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Access denied: You do not have the required permissions to access this resource."));

        // Verify that the actual controller logic was NEVER executed
        verify(adminController, never()).getAdminSummary(any());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void adminEndpoint_accessedByAdminUser_returnsOkAndExecutesMethod() throws Exception {
        mockMvc.perform(get("/api/v1/admin/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").exists());

        verify(adminController).getAdminSummary(any());
    }
}
