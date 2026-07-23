package com.abhiiterates.os.productivity.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.productivity.dto.CalendarEventRequest;
import com.abhiiterates.os.productivity.dto.CalendarEventResponse;
import com.abhiiterates.os.productivity.service.CalendarEventService;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarEventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getAllEvents(
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        List<CalendarEventResponse> events = eventService.getAllEvents(user);
        return ResponseEntity.ok(ApiResponse.success(events, "Calendar events retrieved successfully", request.getRequestURI()));
    }

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> createEvent(
            @Valid @RequestBody CalendarEventRequest eventRequest,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        CalendarEventResponse created = eventService.createEvent(eventRequest, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Event created successfully", request.getRequestURI()));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody CalendarEventRequest eventRequest,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        CalendarEventResponse updated = eventService.updateEvent(id, eventRequest, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Event updated successfully", request.getRequestURI()));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        eventService.deleteEvent(id, user);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", request.getRequestURI()));
    }
}
