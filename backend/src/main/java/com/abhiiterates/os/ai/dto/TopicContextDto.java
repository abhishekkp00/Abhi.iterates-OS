package com.abhiiterates.os.ai.dto;

import com.abhiiterates.os.academic.domain.LearningState;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

/**
 * DTO carrying structured academic context for topic tutoring.
 */
@Builder
public record TopicContextDto(
    UUID topicId,
    String topicName,
    UUID subjectId,
    String subjectName,
    List<String> prerequisiteTopicNames,
    LearningState learningState,
    Double recentAssessmentPercentage,
    String nextExamName,
    Long daysToNextExam
) {}
