package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AssessmentAttemptService {
    AssessmentAttemptResponse startAttempt(UUID assessmentId, User user);
    AssessmentAttemptResponse submitAttempt(UUID attemptId, SubmitAssessmentAttemptRequest request, User user);
    
    AssessmentAttemptResponse getAttemptById(UUID attemptId, User user);
    Page<AssessmentAttemptResponse> getUserAttempts(User user, Pageable pageable);
    List<AssessmentAttemptResponse> getAssessmentAttempts(UUID assessmentId, User user);
    
    TopicPerformanceResponse getTopicPerformance(UUID topicId, User user);
}
