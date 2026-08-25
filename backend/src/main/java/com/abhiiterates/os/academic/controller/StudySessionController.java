package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.*;
import com.abhiiterates.os.academic.service.StudySessionService;
import com.abhiiterates.os.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/study-sessions")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionService studySessionService;

    @PostMapping("/start")
    public ResponseEntity<StudySessionResponse> startSession(
            @Valid @RequestBody StartStudySessionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studySessionService.startSession(request, user));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<StudySessionResponse> completeSession(
            @PathVariable UUID id,
            @RequestBody(required = false) CompleteStudySessionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studySessionService.completeSession(id, request, user));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<StudySessionResponse> cancelSession(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studySessionService.cancelSession(id, user));
    }

    @PostMapping("/manual")
    public ResponseEntity<StudySessionResponse> createManualSession(
            @Valid @RequestBody ManualStudySessionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studySessionService.createManualSession(request, user));
    }

    @GetMapping("/active")
    public ResponseEntity<StudySessionResponse> getActiveSession(
            @AuthenticationPrincipal User user) {
        Optional<StudySessionResponse> active = studySessionService.getActiveSession(user);
        return active.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudySessionResponse> getSessionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studySessionService.getSessionById(id, user));
    }

    @GetMapping
    public ResponseEntity<Page<StudySessionResponse>> getUserSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User user) {
        if (start != null && end != null) {
            return ResponseEntity.ok(studySessionService.getUserSessionsByDateRange(user, start, end, pageable));
        }
        return ResponseEntity.ok(studySessionService.getUserSessions(user, pageable));
    }

    @GetMapping("/topics/{topicId}/progress")
    public ResponseEntity<TopicProgressResponse> getTopicProgress(
            @PathVariable UUID topicId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studySessionService.getTopicProgress(topicId, user));
    }
}
