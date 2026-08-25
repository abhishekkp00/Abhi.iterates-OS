package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.AssessmentAttempt;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {
    Page<AssessmentAttempt> findByUserOrderByStartedAtDesc(User user, Pageable pageable);
    List<AssessmentAttempt> findByUserAndAssessmentIdOrderByStartedAtDesc(User user, UUID assessmentId);
    Optional<AssessmentAttempt> findByIdAndUser(UUID id, User user);
}
