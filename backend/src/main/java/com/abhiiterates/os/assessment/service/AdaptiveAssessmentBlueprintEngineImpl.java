package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.academic.service.LearningStateService;
import com.abhiiterates.os.assessment.domain.QuestionDifficulty;
import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.assessment.dto.AssessmentBlueprint;
import com.abhiiterates.os.assessment.dto.GenerateAdaptiveAssessmentRequest;
import com.abhiiterates.os.assessment.repository.TopicAssessmentPerformanceRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdaptiveAssessmentBlueprintEngineImpl implements AdaptiveAssessmentBlueprintEngine {

    private final LearningStateService learningStateService;
    private final TopicRepository topicRepository;
    private final TopicAssessmentPerformanceRepository performanceRepository;

    @Override
    public AssessmentBlueprint buildBlueprint(GenerateAdaptiveAssessmentRequest request, User user) {
        Topic topic = topicRepository.findByIdAndUserId(request.getTopicId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found or access denied: " + request.getTopicId()));

        LearningStateResult learningState = learningStateService.getTopicLearningState(topic.getId(), user);
        List<TopicAssessmentPerformance> perfs = performanceRepository.findByUserAndTopicIdOrderByEvaluatedAtDesc(user, topic.getId());

        LearningState state = learningState != null && learningState.state() != null ? learningState.state() : LearningState.INSUFFICIENT_DATA;
        Double accuracy = learningState != null && learningState.recentAveragePercentage() != null ? learningState.recentAveragePercentage() : 0.0;

        QuestionDifficulty difficulty;
        if (request.getDifficulty() != null) {
            difficulty = request.getDifficulty();
        } else if (state == LearningState.WEAK || accuracy < 50.0) {
            difficulty = QuestionDifficulty.EASY;
        } else if (state == LearningState.STRONG && accuracy >= 85.0) {
            difficulty = QuestionDifficulty.HARD;
        } else {
            difficulty = QuestionDifficulty.MEDIUM;
        }

        List<String> focusAreas = new ArrayList<>();
        focusAreas.add(topic.getName() + " core principles");

        if (state == LearningState.WEAK) {
            focusAreas.add("Fundamental concepts and basic definitions");
        } else if (state == LearningState.DEVELOPING) {
            focusAreas.add("Practical applications and common problem patterns");
        } else {
            focusAreas.add("Complex scenario analysis and edge-case reasoning");
        }

        if (!perfs.isEmpty() && perfs.get(0).getPercentage() < 60.0) {
            focusAreas.add("Review of previous test errors and misconception areas");
        }

        String rationale = String.format(
                "Blueprint adapted for learning state [%s] (Accuracy: %.1f%%). Target difficulty set to [%s].",
                state,
                accuracy,
                difficulty
        );

        log.info("Built assessment blueprint for topic [{}] user [{}]: {}", topic.getName(), user.getId(), rationale);

        return AssessmentBlueprint.builder()
                .topicId(topic.getId())
                .topicName(topic.getName())
                .learningState(state)
                .accuracyPercentage(accuracy)
                .targetDifficulty(difficulty)
                .suggestedQuestionCount(request.getQuestionCount())
                .focusAreas(focusAreas)
                .rationale(rationale)
                .build();
    }
}
