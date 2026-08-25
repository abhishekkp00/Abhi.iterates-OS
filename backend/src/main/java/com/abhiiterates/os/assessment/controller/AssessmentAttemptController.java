package com.abhiiterates.os.assessment.controller;

import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.service.AssessmentAttemptService;
import com.abhiiterates.os.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessment-attempts")
@RequiredArgsConstructor
public class AssessmentAttemptController {

    private final AssessmentAttemptService attemptService;

    @PostMapping("/assessments/{assessmentId}/start")
    public ResponseEntity<AssessmentAttemptResponse> startAttempt(
            @PathVariable UUID assessmentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attemptService.startAttempt(assessmentId, user));
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<AssessmentAttemptResponse> submitAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SubmitAssessmentAttemptRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attemptService.submitAttempt(attemptId, request, user));
    }

    @GetMapping("/{attemptId}")
    public ResponseEntity<AssessmentAttemptResponse> getAttemptById(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attemptService.getAttemptById(attemptId, user));
    }

    @GetMapping
    public ResponseEntity<Page<AssessmentAttemptResponse>> getUserAttempts(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attemptService.getUserAttempts(user, pageable));
    }

    @GetMapping("/assessments/{assessmentId}")
    public ResponseEntity<List<AssessmentAttemptResponse>> getAssessmentAttempts(
            @PathVariable UUID assessmentId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attemptService.getAssessmentAttempts(assessmentId, user));
    }

    @GetMapping("/topics/{topicId}/performance")
    public ResponseEntity<TopicPerformanceResponse> getTopicPerformance(
            @PathVariable UUID topicId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(attemptService.getTopicPerformance(topicId, user));
    }
}
