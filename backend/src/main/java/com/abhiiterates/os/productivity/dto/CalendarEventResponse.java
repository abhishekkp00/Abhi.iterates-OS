package com.abhiiterates.os.productivity.dto;

import com.abhiiterates.os.productivity.domain.CalendarEvent;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record CalendarEventResponse(
    UUID id,
    String title,
    String description,
    Instant startTime,
    Instant endTime,
    String location,
    String color,
    Instant createdAt,
    Instant updatedAt
) {
    public static CalendarEventResponse fromEntity(CalendarEvent event) {
        return CalendarEventResponse.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .startTime(event.getStartTime())
            .endTime(event.getEndTime())
            .location(event.getLocation())
            .color(event.getColor())
            .createdAt(event.getCreatedAt())
            .updatedAt(event.getUpdatedAt())
            .build();
    }
}
