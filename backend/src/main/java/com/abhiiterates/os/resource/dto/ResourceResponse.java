package com.abhiiterates.os.resource.dto;

import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {
    private UUID id;
    private String title;
    private String description;
    private ResourceCategory category;
    private ResourcePriority priority;
    private ResourceStatus status;
    private Instant deadline;
    private String tags;
    private Instant createdAt;
    private Instant updatedAt;
    private List<AttachmentResponse> attachments;
    private UUID userId;
}
