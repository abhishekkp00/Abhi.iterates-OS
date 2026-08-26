package com.abhiiterates.os.planner.dto;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.StudySessionType;
import lombok.Builder;

import java.util.UUID;

@Builder
public record TopicPriorityBreakdownResponse(
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        LearningState learningState,
        StudySessionType recommendedStrategy,
        double weaknessFactor,
        double examUrgencyFactor,
        double trendFactor,
        double recencyFactor,
        double goalUrgencyFactor,
        double prerequisiteImportanceFactor,
        double neglectFactor,
        double rawScore,
        boolean isHighEffortLowPerformance,
        String reason
) {}
