package com.abhiiterates.os.academic.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record SubjectLearningStateSummary(
        UUID subjectId,
        String subjectName,
        Integer totalTopics,
        Integer strongCount,
        Integer developingCount,
        Integer weakCount,
        Integer insufficientDataCount,
        List<LearningStateResult> topicResults
) {}
