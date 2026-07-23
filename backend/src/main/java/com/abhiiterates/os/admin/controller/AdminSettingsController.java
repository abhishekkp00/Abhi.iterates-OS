package com.abhiiterates.os.admin.controller;

import com.abhiiterates.os.admin.AuditLog;
import com.abhiiterates.os.admin.AuditLogRepository;
import com.abhiiterates.os.admin.SystemSetting;
import com.abhiiterates.os.admin.SystemSettingRepository;
import com.abhiiterates.os.admin.dto.SystemSettingsDto;
import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin System Settings", description = "Endpoints to configure feature flags, maintenance, and tokens")
@Slf4j
public class AdminSettingsController {

    private final SystemSettingRepository settingRepository;
    private final AuditLogRepository auditLogRepository;

    private String getOrInit(String key, String defaultValue, String description) {
        return settingRepository.findBySettingKey(key)
                .orElseGet(() -> settingRepository.save(SystemSetting.builder()
                        .settingKey(key)
                        .settingValue(defaultValue)
                        .description(description)
                        .build()))
                .getSettingValue();
    }

    private void updateOrSave(String key, String value) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        settingRepository.save(setting);
    }

    @GetMapping
    @Operation(summary = "Get global system configuration parameters and feature flags")
    public ResponseEntity<ApiResponse<SystemSettingsDto>> getSettings(HttpServletRequest request) {
        log.info("Admin requested global settings configuration.");

        boolean maintenanceMode = Boolean.parseBoolean(getOrInit("maintenanceMode", "false", "Blocks general student login access during upgrades"));
        boolean enableAiAssistant = Boolean.parseBoolean(getOrInit("enableAiAssistant", "true", "Enables AI study tutor feature"));
        boolean marketplaceAutoApprove = Boolean.parseBoolean(getOrInit("marketplaceAutoApprove", "true", "Bypasses marketplace moderation index"));
        int maxTokens = Integer.parseInt(getOrInit("maxTokensPerSession", "2000", "Maximum LLM token limit per study chat"));
        String apiKey = getOrInit("apiKeyConfig", "", "Decryption API key configuration");

        SystemSettingsDto dto = SystemSettingsDto.builder()
                .maintenanceMode(maintenanceMode)
                .enableAiAssistant(enableAiAssistant)
                .marketplaceAutoApprove(marketplaceAutoApprove)
                .maxTokensPerSession(maxTokens)
                .apiKeyConfig(apiKey)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(dto, "System settings loaded successfully", request.getRequestURI())
        );
    }

    @PutMapping
    @Operation(summary = "Update global system configuration parameters and feature flags")
    public ResponseEntity<ApiResponse<Void>> saveSettings(
            @Valid @RequestBody SystemSettingsDto dto,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest request
    ) {
        log.info("Admin '{}' updated global settings configuration.", adminUser.getEmail());

        updateOrSave("maintenanceMode", String.valueOf(dto.maintenanceMode()));
        updateOrSave("enableAiAssistant", String.valueOf(dto.enableAiAssistant()));
        updateOrSave("marketplaceAutoApprove", String.valueOf(dto.marketplaceAutoApprove()));
        updateOrSave("maxTokensPerSession", String.valueOf(dto.maxTokensPerSession()));
        updateOrSave("apiKeyConfig", dto.apiKeyConfig());

        auditLogRepository.save(AuditLog.builder()
                .adminEmail(adminUser.getEmail())
                .action("UPDATE_SYSTEM_SETTINGS")
                .target("SYSTEM_CONFIG")
                .details(String.format("Maint: %b | AI: %b | AutoApprove: %b | Tokens: %d",
                        dto.maintenanceMode(), dto.enableAiAssistant(), dto.marketplaceAutoApprove(), dto.maxTokensPerSession()))
                .ipAddress(request.getRemoteAddr())
                .createdAt(Instant.now())
                .build());

        return ResponseEntity.ok(
                ApiResponse.success(null, "System settings updated successfully", request.getRequestURI())
        );
    }
}
