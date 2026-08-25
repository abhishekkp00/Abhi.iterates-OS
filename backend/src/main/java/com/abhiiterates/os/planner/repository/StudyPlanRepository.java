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
     * All plans for a user with a specific status.
     */
    List<StudyPlan> findByUserAndStatus(User user, StudyPlanStatus status);
}
