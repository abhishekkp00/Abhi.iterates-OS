package com.abhiiterates.os.productivity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;

@Builder
public record CalendarEventRequest(
    @NotBlank(message = "Title is required")
    String title,
    
    String description,
    
    @NotNull(message = "Start time is required")
    Instant startTime,
    
    @NotNull(message = "End time is required")
    Instant endTime,
    
    String location,
    
    String color
) {}
