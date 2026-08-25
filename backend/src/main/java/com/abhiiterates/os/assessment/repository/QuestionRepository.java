package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByAssessmentIdOrderByQuestionOrderAsc(UUID assessmentId);
    
    @Query("SELECT q FROM Question q WHERE q.id = :questionId AND q.assessment.user.id = :userId")
    Optional<Question> findByIdAndUserId(@Param("questionId") UUID questionId, @Param("userId") UUID userId);
}
