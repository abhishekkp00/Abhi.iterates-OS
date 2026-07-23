package com.abhiiterates.os.productivity.dto;

import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record TaskResponse(
    UUID id,
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    String category,
    Instant dueDate,
    Instant createdAt,
    Instant updatedAt
) {
    public static TaskResponse fromEntity(Task task) {
        return TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus())
            .priority(task.getPriority())
            .category(task.getCategory())
            .dueDate(task.getDueDate())
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }
}
