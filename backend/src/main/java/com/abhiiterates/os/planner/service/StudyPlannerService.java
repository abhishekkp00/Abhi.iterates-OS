package com.abhiiterates.os.planner.service;

import com.abhiiterates.os.planner.dto.*;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface StudyPlannerService {

    /**
     * Generate a plan preview WITHOUT persisting to the database.
     * Used for the "Preview" flow where the student reviews before committing.
     * Returns a transient StudyPlanResponse with a null {@code id}.
     */
    StudyPlanResponse previewPlan(GeneratePlanRequest request, User user);

    /**
     * Generate and persist a plan as DRAFT.
     * The student can review and activate it later.
     */
    StudyPlanResponse saveDraftPlan(GeneratePlanRequest request, User user);

    /**
     * Activate a DRAFT plan.
     * Any currently ACTIVE plan for the user is automatically set to EXPIRED.
     * Returns the now-ACTIVE plan.
     */
    StudyPlanResponse activatePlan(UUID planId, User user);

    /**
     * Manually expire/complete a plan.
     * Only ACTIVE or DRAFT plans can be expired.
     */
    StudyPlanResponse expirePlan(UUID planId, User user);

    /**
     * Regenerate the active study plan based on fresh learning state, exams, and goals evidence.
     * Automatically expires the previous active plan and creates a new ACTIVE plan snapshot.
     */
    StudyPlanResponse regeneratePlan(GeneratePlanRequest request, User user);

    /**
     * Get a plan by ID (IDOR-safe: only the owning user can access).
     */
    StudyPlanResponse getPlan(UUID planId, User user);

    /**
     * Get all plans for the user (most recent first).
     */
    List<StudyPlanSummaryResponse> getUserPlans(User user);

    /**
     * Manually override a planned session's recommended minutes and/or type.
     * Sets isManualOverride=true on the session.
     */
    PlannedStudySessionResponse overrideSession(UUID planId, UUID sessionId,
        OverrideSessionRequest request, User user);

    // ── Preferences ─────────────────────────────────────────────────────────

    PlannerPreferencesDto.Response getPreferences(User user);

    PlannerPreferencesDto.Response upsertPreferences(PlannerPreferencesDto.Request request, User user);
}
