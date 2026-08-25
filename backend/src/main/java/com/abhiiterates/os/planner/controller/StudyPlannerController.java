package com.abhiiterates.os.planner.controller;

import com.abhiiterates.os.planner.dto.*;
import com.abhiiterates.os.planner.service.StudyPlannerService;
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
 * REST controller for the Adaptive Study Planner.
 *
 * Base path: /api/v1/study-plans
 *
 * Plan Lifecycle:
 *   POST /preview           → generate (no DB write, id=null in response)
 *   POST /                  → saveDraft (persists as DRAFT)
 *   POST /{id}/activate     → DRAFT → ACTIVE (auto-expires previous ACTIVE)
 *   POST /{id}/expire       → ACTIVE/DRAFT → EXPIRED
 *   GET  /{id}              → retrieve plan with all sessions
 *   GET  /                  → list all user plans (summary)
 *   PUT  /{id}/sessions/{sessionId}  → manual override a planned session
 *
 * Preferences:
 *   GET  /preferences       → get user planner preferences
 *   PUT  /preferences       → upsert preferences
 */
@RestController
@RequestMapping("/api/v1/study-plans")
@RequiredArgsConstructor
public class StudyPlannerController {

    private final StudyPlannerService plannerService;

    // ── Plan Generation ──────────────────────────────────────────────────────

    /**
     * Preview a generated plan without saving it to the database.
     * The response will have a null {@code id}.
     */
    @PostMapping("/preview")
    public ResponseEntity<StudyPlanResponse> previewPlan(
        @Valid @RequestBody(required = false) GeneratePlanRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.previewPlan(request, user));
    }

    /**
     * Generate and save a plan as DRAFT.
     */
    @PostMapping
    public ResponseEntity<StudyPlanResponse> saveDraftPlan(
        @Valid @RequestBody(required = false) GeneratePlanRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(plannerService.saveDraftPlan(request, user));
    }

    /**
     * Regenerate the active study plan based on fresh learning state evidence.
     * Auto-expires previous active plan and creates a new ACTIVE plan.
     */
    @PostMapping("/regenerate")
    public ResponseEntity<StudyPlanResponse> regeneratePlan(
        @Valid @RequestBody(required = false) GeneratePlanRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(plannerService.regeneratePlan(request, user));
    }

    // ── Plan Lifecycle ───────────────────────────────────────────────────────

    @PostMapping("/{id}/activate")
    public ResponseEntity<StudyPlanResponse> activatePlan(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.activatePlan(id, user));
    }

    @PostMapping("/{id}/expire")
    public ResponseEntity<StudyPlanResponse> expirePlan(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.expirePlan(id, user));
    }

    // ── Plan Retrieval ───────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<StudyPlanResponse> getPlan(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.getPlan(id, user));
    }

    @GetMapping
    public ResponseEntity<List<StudyPlanSummaryResponse>> getUserPlans(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.getUserPlans(user));
    }

    // ── Session Override ─────────────────────────────────────────────────────

    @PutMapping("/{id}/sessions/{sessionId}")
    public ResponseEntity<PlannedStudySessionResponse> overrideSession(
        @PathVariable UUID id,
        @PathVariable UUID sessionId,
        @Valid @RequestBody OverrideSessionRequest request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.overrideSession(id, sessionId, request, user));
    }

    // ── Preferences ──────────────────────────────────────────────────────────

    @GetMapping("/preferences")
    public ResponseEntity<PlannerPreferencesDto.Response> getPreferences(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.getPreferences(user));
    }

    @PutMapping("/preferences")
    public ResponseEntity<PlannerPreferencesDto.Response> upsertPreferences(
        @Valid @RequestBody PlannerPreferencesDto.Request request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(plannerService.upsertPreferences(request, user));
    }
}
