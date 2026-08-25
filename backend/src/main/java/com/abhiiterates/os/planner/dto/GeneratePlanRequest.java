package com.abhiiterates.os.planner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;

/**
 * Optional request body for generating a study plan.
 * All fields are optional — omitted values fall back to the user's saved preferences or defaults.
 */
public record GeneratePlanRequest(
    @Min(value = 15, message = "Available minutes per day must be at least 15")
    @Max(value = 720, message = "Available minutes per day cannot exceed 720")
    Integer availableMinutesPerDay,

    @Min(value = 15, message = "Session length must be at least 15 minutes")
    @Max(value = 180, message = "Session length cannot exceed 180 minutes")
    Integer preferredSessionLengthMinutes,

    @Min(value = 1, message = "Planning horizon must be at least 1 day")
    @Max(value = 90, message = "Planning horizon cannot exceed 90 days")
    Integer planningHorizonDays,

    /**
     * Optional exam ID to focus the plan on a specific upcoming exam.
     */
    UUID examId
) {
    public GeneratePlanRequest(Integer availableMinutesPerDay, Integer preferredSessionLengthMinutes, Integer planningHorizonDays) {
        this(availableMinutesPerDay, preferredSessionLengthMinutes, planningHorizonDays, null);
    }
}
