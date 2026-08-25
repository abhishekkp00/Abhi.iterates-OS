package com.abhiiterates.os.planner.dto;

import com.abhiiterates.os.academic.domain.StudySessionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to manually override a planned session's duration or type.
 */
public record OverrideSessionRequest(
    /**
     * New recommended duration. If null, keeps the planner's original value.
     */
    @Min(value = 5, message = "Override session must be at least 5 minutes")
    @Max(value = 480, message = "Override session cannot exceed 480 minutes")
    Integer recommendedMinutes,

    /**
     * Override session type. If null, keeps the planner's original type.
     */
    StudySessionType sessionType,

    /**
     * Required explanation for why the override was made.
     */
    @NotBlank(message = "Override notes are required")
    @Size(max = 500, message = "Override notes cannot exceed 500 characters")
    String overrideNotes
) {}
