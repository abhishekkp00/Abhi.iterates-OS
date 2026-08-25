package com.abhiiterates.os.academic.controller;

import com.abhiiterates.os.academic.dto.AcademicGoalRequest;
import com.abhiiterates.os.academic.service.AcademicGoalService;
import com.abhiiterates.os.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing academic goals.
 * Goals provide deadline-driven urgency signals to the Adaptive Study Planner.
 *
 * Base path: /api/v1/academic/goals
 */
@RestController
@RequestMapping("/api/v1/academic/goals")
@RequiredArgsConstructor
public class AcademicGoalController {

    private final AcademicGoalService goalService;

    @PostMapping
    public ResponseEntity<AcademicGoalRequest.Response> createGoal(
        @Valid @RequestBody AcademicGoalRequest.Request request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(goalService.createGoal(request, user));
    }

    @GetMapping
    public ResponseEntity<List<AcademicGoalRequest.Response>> getActiveGoals(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(goalService.getActiveGoals(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicGoalRequest.Response> updateGoal(
        @PathVariable UUID id,
        @Valid @RequestBody AcademicGoalRequest.Request request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(goalService.updateGoal(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateGoal(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        goalService.deactivateGoal(id, user);
        return ResponseEntity.noContent().build();
    }
}
