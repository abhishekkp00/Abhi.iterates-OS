package com.abhiiterates.os.admin.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record AdminAttachmentDto(
        UUID id,
        String fileName,
        Long fileSize,
        String contentType,
        String downloadUrl,
        String fileUrl
) {}
