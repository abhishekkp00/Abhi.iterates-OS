package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.EvidenceLevel;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.LearningTrend;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.dto.SubjectLearningStateSummary;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface LearningStateService {
    LearningStateResult getTopicLearningState(UUID topicId, User user);
    List<LearningStateResult> getUserTopicsLearningState(User user, UUID subjectIdFilter, LearningState stateFilter, LearningTrend trendFilter, EvidenceLevel evidenceFilter);
    SubjectLearningStateSummary getSubjectLearningStateSummary(UUID subjectId, User user);
}
