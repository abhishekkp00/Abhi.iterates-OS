package com.abhiiterates.os.resource.dto;

import com.abhiiterates.os.resource.ResourceCategory;
import com.abhiiterates.os.resource.ResourcePriority;
import com.abhiiterates.os.resource.ResourceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private ResourceCategory category;

    @NotNull(message = "Priority is required")
    private ResourcePriority priority;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private Instant deadline;

    private String tags;
}
