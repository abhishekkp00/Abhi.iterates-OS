package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.AssessmentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssessmentAnswerRepository extends JpaRepository<AssessmentAnswer, UUID> {
    List<AssessmentAnswer> findByAttemptId(UUID attemptId);
    Optional<AssessmentAnswer> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);
}
