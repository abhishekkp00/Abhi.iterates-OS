package com.abhiiterates.os.planner.repository;

import com.abhiiterates.os.planner.domain.PlannedStudySession;
import com.abhiiterates.os.planner.domain.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlannedStudySessionRepository extends JpaRepository<PlannedStudySession, UUID> {

    /**
     * All sessions for a plan, ordered by day then display order.
     */
    List<PlannedStudySession> findByStudyPlanOrderByDayNumberAscDisplayOrderAsc(StudyPlan studyPlan);

    /**
     * IDOR-safe lookup for a specific planned session by ID and plan user.
     */
    @Query("""
        SELECT pss FROM PlannedStudySession pss
        WHERE pss.id = :id AND pss.user.id = :userId
        """)
    Optional<PlannedStudySession> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}
