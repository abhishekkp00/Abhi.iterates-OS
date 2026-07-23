package com.abhiiterates.os.admin.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record AdminSummaryResponse(
        long totalUsers,
        long totalResources,
        long totalListings,
        long totalConversations,
        List<SystemStatusDto> systemStatus,
        List<String> recentActivities
) {}
