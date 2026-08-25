package com.abhiiterates.os.assessment.repository;

import com.abhiiterates.os.assessment.domain.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {
    List<QuestionOption> findByQuestionIdOrderByOptionOrderAsc(UUID questionId);
}
