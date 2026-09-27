package com.abhiiterates.os.productivity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.Instant;

@Builder
public record CalendarEventRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title,
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,
    
    @NotNull(message = "Start time is required")
    Instant startTime,
    
    @NotNull(message = "End time is required")
    Instant endTime,
    
    @Size(max = 200, message = "Location cannot exceed 200 characters")
    String location,
    
    @Size(max = 50, message = "Color cannot exceed 50 characters")
    String color
) {}
