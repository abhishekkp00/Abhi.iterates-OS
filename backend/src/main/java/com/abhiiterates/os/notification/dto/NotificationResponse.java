package com.abhiiterates.os.notification.dto;

import com.abhiiterates.os.notification.domain.NotificationType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.UUID;

/**
 * NotificationResponse — wire representation of a single notification.
 *
 * Deliberately a record (immutable value object) — serialised directly by Jackson.
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String message,
        String actionUrl,
        UUID entityId,
        boolean read,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant createdAt
) {}
