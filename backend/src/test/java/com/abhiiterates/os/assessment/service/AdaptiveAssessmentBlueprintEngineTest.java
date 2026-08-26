package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.dto.AssessmentBlueprint;
import com.abhiiterates.os.assessment.dto.GenerateAdaptiveAssessmentRequest;
import com.abhiiterates.os.assessment.repository.TopicAssessmentPerformanceRepository;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdaptiveAssessmentBlueprintEngineTest {

    @Mock
    private LearningStateService learningStateService;

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private TopicAssessmentPerformanceRepository performanceRepository;

    @InjectMocks
    private AdaptiveAssessmentBlueprintEngineImpl blueprintEngine;

    private User testUser;
    private Subject testSubject;
    private Topic testTopic;
    private UUID topicId;

    @BeforeEach
    void setUp() {
        topicId = UUID.randomUUID();
        testUser = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
        testSubject = Subject.builder().id(UUID.randomUUID()).name("Computer Science").user(testUser).build();
        testTopic = Topic.builder().id(topicId).name("Data Structures").subject(testSubject).build();
    }

    @Test
    @DisplayName("WEAK learning state yields EASY target difficulty blueprint")
    void weak_learning_state_yields_easy_difficulty() {
        when(topicRepository.findByIdAndUserId(eq(topicId), any())).thenReturn(Optional.of(testTopic));
        when(learningStateService.getTopicLearningState(eq(topicId), any()))
                .thenReturn(LearningStateResult.builder().topicId(topicId).state(LearningState.WEAK).recentAveragePercentage(35.0).build());
        when(performanceRepository.findByUserAndTopicIdOrderByEvaluatedAtDesc(any(), eq(topicId))).thenReturn(List.of());

        GenerateAdaptiveAssessmentRequest req = GenerateAdaptiveAssessmentRequest.builder()
                .topicId(topicId)
                .questionCount(5)
                .build();

        AssessmentBlueprint blueprint = blueprintEngine.buildBlueprint(req, testUser);

        assertThat(blueprint.getTargetDifficulty()).isEqualTo(QuestionDifficulty.EASY);
        assertThat(blueprint.getLearningState()).isEqualTo(LearningState.WEAK);
        assertThat(blueprint.getSuggestedQuestionCount()).isEqualTo(5);
        assertThat(blueprint.getFocusAreas()).contains("Data Structures core principles");
    }

    @Test
    @DisplayName("STRONG learning state yields HARD target difficulty blueprint")
    void strong_learning_state_yields_hard_difficulty() {
        when(topicRepository.findByIdAndUserId(eq(topicId), any())).thenReturn(Optional.of(testTopic));
        when(learningStateService.getTopicLearningState(eq(topicId), any()))
                .thenReturn(LearningStateResult.builder().topicId(topicId).state(LearningState.STRONG).recentAveragePercentage(90.0).build());
        when(performanceRepository.findByUserAndTopicIdOrderByEvaluatedAtDesc(any(), eq(topicId))).thenReturn(List.of());

        GenerateAdaptiveAssessmentRequest req = GenerateAdaptiveAssessmentRequest.builder()
                .topicId(topicId)
                .questionCount(10)
                .build();

        AssessmentBlueprint blueprint = blueprintEngine.buildBlueprint(req, testUser);

        assertThat(blueprint.getTargetDifficulty()).isEqualTo(QuestionDifficulty.HARD);
        assertThat(blueprint.getLearningState()).isEqualTo(LearningState.STRONG);
        assertThat(blueprint.getSuggestedQuestionCount()).isEqualTo(10);
    }
}
