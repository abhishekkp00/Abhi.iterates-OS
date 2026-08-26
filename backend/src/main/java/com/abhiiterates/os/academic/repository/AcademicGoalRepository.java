package com.abhiiterates.os.academic.repository;

import com.abhiiterates.os.academic.domain.AcademicGoal;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AcademicGoalRepository extends JpaRepository<AcademicGoal, UUID> {

    /**
     * All active goals for a user, ordered by target date ascending (soonest first).
     */
    List<AcademicGoal> findByUserAndIsActiveTrueOrderByTargetDateAsc(User user);

    /**
     * IDOR-safe lookup by goal ID and user.
     */
    Optional<AcademicGoal> findByIdAndUser(UUID id, User user);

    /**
     * Find active goal for a specific user + topic combination.
     * Used to enforce one active goal per topic per user.
     */
    Optional<AcademicGoal> findByUserAndTopicAndIsActiveTrue(User user, Topic topic);

    /**
     * Bulk-load active goals for a set of topic IDs (used by PriorityCalculator).
     */
    @Query("SELECT g FROM AcademicGoal g WHERE g.user = :user AND g.isActive = true AND g.topic.id IN :topicIds")
    List<AcademicGoal> findActiveGoalsForTopics(@Param("user") User user, @Param("topicIds") List<UUID> topicIds);

    /**
     * Eager-fetch active goals with Topic and Subject pre-loaded via JOIN FETCH.
     * Used by AcademicDashboardServiceImpl to eliminate the lazy Topic/Subject load
     * when building GoalSummary DTOs: goal.getTopic().getSubject().getName() no
     * longer triggers additional SELECT per goal.
     *
     * <p><strong>Performance contract:</strong> Replaces
     * {@link #findByUserAndIsActiveTrueOrderByTargetDateAsc(User)} in dashboard
     * paths. Produces 1 SQL instead of 1 + 2N lazy SQL statements.</p>
     */
    @Query("SELECT g FROM AcademicGoal g " +
           "JOIN FETCH g.topic t " +
           "JOIN FETCH t.subject " +
           "WHERE g.user = :user AND g.isActive = true " +
           "ORDER BY g.targetDate ASC")
    List<AcademicGoal> findActiveGoalsWithTopicAndSubject(@Param("user") User user);
}
