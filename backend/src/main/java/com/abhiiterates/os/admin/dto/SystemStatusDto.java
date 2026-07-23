package com.abhiiterates.os.admin.dto;

import lombok.Builder;

@Builder
public record SystemStatusDto(
        String serviceName,
        String status, // "UP", "DEGRADED", "DOWN"
        String latency,
        String message
) {}
