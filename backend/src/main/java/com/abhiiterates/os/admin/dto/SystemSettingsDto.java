package com.abhiiterates.os.admin.dto;

import lombok.Builder;

@Builder
public record SystemSettingsDto(
        boolean maintenanceMode,
        boolean enableAiAssistant,
        boolean marketplaceAutoApprove,
        int maxTokensPerSession,
        String apiKeyConfig
) {}
