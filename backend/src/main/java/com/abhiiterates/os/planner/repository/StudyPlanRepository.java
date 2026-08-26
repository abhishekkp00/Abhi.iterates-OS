package com.abhiiterates.os.planner.repository;

import com.abhiiterates.os.planner.domain.StudyPlan;
import com.abhiiterates.os.planner.domain.StudyPlanStatus;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, UUID> {

    /**
     * IDOR-safe lookup: only returns the plan if it belongs to the given user.
     */
    Optional<StudyPlan> findByIdAndUser(UUID id, User user);

    /**
     * All plans for a user, most recent first.
     */
    List<StudyPlan> findByUserOrderByCreatedAtDesc(User user);

    /**
     * The user's currently active plan (at most one should exist).
     */
    @Query("SELECT sp FROM StudyPlan sp WHERE sp.user = :user AND sp.status = 'ACTIVE'")
    Optional<StudyPlan> findActiveByUser(@Param("user") User user);

    /**
     * Active plan with PlannedSessions, their Topics, and Topics' Subjects eagerly loaded.
     * Used by AcademicDashboardServiceImpl.getDashboard() to eliminate per-session
     * lazy loads when building PlannedStudySessionResponse DTOs.
     *
     * <p><strong>Performance contract:</strong> Replaces the combination of
     * {@link #findActiveByUser(User)} + Hibernate lazy-loading of sessions/topics/subjects.
     * Produces 1 SQL instead of 1 + (sessions × 2) lazy SQL statements.</p>
     *
     * <p><strong>Note:</strong> Use this variant in read-only dashboard/view contexts.
     * For mutation paths (activate, expire, save), use {@link #findActiveByUser(User)}.</p>
     */
    @Query("SELECT sp FROM StudyPlan sp " +
           "LEFT JOIN FETCH sp.plannedSessions s " +
           "LEFT JOIN FETCH s.topic t " +
           "LEFT JOIN FETCH t.subject " +
           "WHERE sp.user = :user AND sp.status = 'ACTIVE'")
    Optional<StudyPlan> findActiveByUserWithSessions(@Param("user") User user);

    /**
     * All plans for a user with a specific status.
     */
    List<StudyPlan> findByUserAndStatus(User user, StudyPlanStatus status);
}
