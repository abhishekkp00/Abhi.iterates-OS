package com.abhiiterates.os.admin.dto;

import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record AdminResourceResponseDto(
        UUID id,
        String title,
        String description,
        ResourceCategory category,
        ResourcePriority priority,
        ResourceStatus status,
        Instant deadline,
        String tags,
        boolean starred,
        UUID creatorId,
        String creatorEmail,
        String creatorUsername,
        List<AdminAttachmentDto> attachments,
        Instant createdAt,
        Instant updatedAt
) {}
