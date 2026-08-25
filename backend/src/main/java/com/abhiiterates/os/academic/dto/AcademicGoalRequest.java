package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.GoalTargetState;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class AcademicGoalRequest {

    public record Request(
        @NotNull(message = "Topic ID is required")
        UUID topicId,

        @NotNull(message = "Target state is required")
        GoalTargetState targetState,

        @NotNull(message = "Target date is required")
        @Future(message = "Target date must be in the future")
        LocalDate targetDate,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description
    ) {}

    @Builder
    public record Response(
        UUID id,
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        GoalTargetState targetState,
        LocalDate targetDate,
        String description,
        Boolean isActive,
        long daysRemaining,
        Instant createdAt,
        Instant updatedAt
    ) {}
}
