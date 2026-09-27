package com.abhiiterates.os.productivity.dto;

import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;

@Builder
public record TaskRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title,
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,
    
    @NotNull(message = "Status is required")
    TaskStatus status,
    
    @NotNull(message = "Priority is required")
    TaskPriority priority,
    
    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category cannot exceed 50 characters")
    String category,
    
    Instant dueDate
) {}
