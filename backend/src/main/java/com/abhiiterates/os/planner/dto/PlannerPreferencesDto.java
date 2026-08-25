package com.abhiiterates.os.planner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

public class PlannerPreferencesDto {

    public record Request(
        @Min(value = 15, message = "Available minutes per day must be at least 15")
        @Max(value = 720, message = "Available minutes per day cannot exceed 720 (12 hours)")
        Integer availableMinutesPerDay,

        @Min(value = 15, message = "Session length must be at least 15 minutes")
        @Max(value = 180, message = "Session length cannot exceed 180 minutes")
        Integer preferredSessionLengthMinutes,

        @Min(value = 1, message = "Planning horizon must be at least 1 day")
        @Max(value = 90, message = "Planning horizon cannot exceed 90 days")
        Integer planningHorizonDays
    ) {}

    @Builder
    public record Response(
        UUID id,
        int availableMinutesPerDay,
        int preferredSessionLengthMinutes,
        int planningHorizonDays,
        Instant createdAt,
        Instant updatedAt
    ) {}
}
