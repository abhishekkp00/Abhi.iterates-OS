package com.abhiiterates.os.planner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Optional request body for generating a study plan.
 * All fields are optional — omitted values fall back to the user's saved
 * {@link com.abhiiterates.os.planner.domain.PlannerPreferences}, or to system defaults.
 */
public record GeneratePlanRequest(
    /**
     * Override for how many minutes per day the student has available.
     * Range: 15–720.
     */
    @Min(value = 15, message = "Available minutes per day must be at least 15")
    @Max(value = 720, message = "Available minutes per day cannot exceed 720")
    Integer availableMinutesPerDay,

    /**
     * Override for preferred single-session length.
     * Range: 15–180.
     */
    @Min(value = 15, message = "Session length must be at least 15 minutes")
    @Max(value = 180, message = "Session length cannot exceed 180 minutes")
    Integer preferredSessionLengthMinutes,

    /**
     * Override for how many days the plan should cover.
     * Range: 1–90.
     */
    @Min(value = 1, message = "Planning horizon must be at least 1 day")
    @Max(value = 90, message = "Planning horizon cannot exceed 90 days")
    Integer planningHorizonDays
) {}
