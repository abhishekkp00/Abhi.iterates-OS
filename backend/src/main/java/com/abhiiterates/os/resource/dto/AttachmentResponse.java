package com.abhiiterates.os.resource.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentResponse {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private String downloadUrl;
}
