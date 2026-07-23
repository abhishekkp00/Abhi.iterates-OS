package com.abhiiterates.os.productivity.dto;

import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;

@Builder
public record TaskRequest(
    @NotBlank(message = "Title is required")
    String title,
    
    String description,
    
    @NotNull(message = "Status is required")
    TaskStatus status,
    
    @NotNull(message = "Priority is required")
    TaskPriority priority,
    
    @NotBlank(message = "Category is required")
    String category,
    
    Instant dueDate
) {}
