package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.*;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.dto.SubjectLearningStateSummary;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicProgressRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.assessment.domain.TopicAssessmentPerformance;
import com.abhiiterates.os.assessment.repository.TopicAssessmentPerformanceRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningStateServiceImpl implements LearningStateService {

    private final TopicRepository topicRepository;
    private final SubjectRepository subjectRepository;
    private final TopicProgressRepository topicProgressRepository;
    private final TopicAssessmentPerformanceRepository topicPerformanceRepository;
    private final AcademicService academicService;

    private final LearningStateCalculator stateCalculator;
    private final TrendCalculator trendCalculator;
    private final EvidenceLevelCalculator evidenceLevelCalculator;

    @Override
    @Transactional(readOnly = true)
    public LearningStateResult getTopicLearningState(UUID topicId, User user) {
        Topic topic = academicService.validateTopicOwnership(topicId, user);
        return calculateTopicLearningState(topic, user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningStateResult> getUserTopicsLearningState(User user, UUID subjectIdFilter, LearningState stateFilter, LearningTrend trendFilter, EvidenceLevel evidenceFilter) {
        List<Topic> topics;
        if (subjectIdFilter != null) {
            Subject subject = subjectRepository.findByIdAndUser(subjectIdFilter, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied: " + subjectIdFilter));
            topics = topicRepository.findBySubjectIdOrderByNameAsc(subject.getId());
        } else {
            topics = topicRepository.findBySubjectUserIdOrderByNameAsc(user.getId());
        }

        List<LearningStateResult> results = new ArrayList<>();
        for (Topic topic : topics) {
            LearningStateResult res = calculateTopicLearningState(topic, user);

            if (stateFilter != null && res.state() != stateFilter) {
                continue;
            }
            if (trendFilter != null && res.trend() != trendFilter) {
                continue;
            }
            if (evidenceFilter != null && res.evidenceLevel() != evidenceFilter) {
                continue;
            }

            results.add(res);
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectLearningStateSummary getSubjectLearningStateSummary(UUID subjectId, User user) {
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied: " + subjectId));

        List<Topic> topics = topicRepository.findBySubjectIdOrderByNameAsc(subject.getId());

        int strong = 0;
        int developing = 0;
        int weak = 0;
        int insufficient = 0;

        List<LearningStateResult> topicResults = new ArrayList<>();

        for (Topic topic : topics) {
            LearningStateResult res = calculateTopicLearningState(topic, user);
            topicResults.add(res);

            switch (res.state()) {
                case STRONG -> strong++;
                case DEVELOPING -> developing++;
                case WEAK -> weak++;
                case INSUFFICIENT_DATA -> insufficient++;
            }
        }

        return SubjectLearningStateSummary.builder()
                .subjectId(subject.getId())
                .subjectName(subject.getName())
                .totalTopics(topics.size())
                .strongCount(strong)
                .developingCount(developing)
                .weakCount(weak)
                .insufficientDataCount(insufficient)
                .topicResults(topicResults)
                .build();
    }

    private LearningStateResult calculateTopicLearningState(Topic topic, User user) {
        // Fetch study progress projection
        Optional<TopicProgress> progressOpt = topicProgressRepository.findByUserAndTopic(user, topic);
        int totalStudyMinutes = progressOpt.map(TopicProgress::getTotalStudyMinutes).orElse(0);
        int studySessionCount = progressOpt.map(TopicProgress::getSessionCount).orElse(0);
        Instant lastStudiedAt = progressOpt.map(TopicProgress::getLastStudiedAt).orElse(null);

        Long daysSinceLastStudied = lastStudiedAt != null
                ? Duration.between(lastStudiedAt, Instant.now()).toDays()
                : null;

        // Fetch assessment performances ordered by evaluatedAt DESC
        List<TopicAssessmentPerformance> performances = topicPerformanceRepository
                .findByUserAndTopicIdOrderByEvaluatedAtDesc(user, topic.getId());

        int attemptCount = performances.size();
        Instant lastAssessmentAt = attemptCount > 0 ? performances.get(0).getEvaluatedAt() : null;
        Long daysSinceLastAssessment = lastAssessmentAt != null
                ? Duration.between(lastAssessmentAt, Instant.now()).toDays()
                : null;

        Double recentAveragePercentage = null;
        Double historicalAveragePercentage = null;

        if (attemptCount > 0) {
            // Recent average: average of up to 3 most recent attempts
            int recentWindow = Math.min(3, attemptCount);
            double recentSum = performances.subList(0, recentWindow).stream()
                    .mapToDouble(TopicAssessmentPerformance::getPercentage)
                    .sum();
            recentAveragePercentage = Math.round((recentSum / recentWindow) * 10.0) / 10.0;

            // Historical average: average of all attempts
            double totalSum = performances.stream()
                    .mapToDouble(TopicAssessmentPerformance::getPercentage)
                    .sum();
            historicalAveragePercentage = Math.round((totalSum / attemptCount) * 10.0) / 10.0;
        }

        // Calculate state, trend, evidence level
        LearningStateCalculator.CalculationResult stateRes = stateCalculator.calculateState(recentAveragePercentage, attemptCount);
        LearningTrend trend = trendCalculator.calculateTrend(performances);
        EvidenceLevel evidenceLevel = evidenceLevelCalculator.calculateEvidenceLevel(attemptCount);

        return LearningStateResult.builder()
                .topicId(topic.getId())
                .topicName(topic.getName())
                .subjectId(topic.getSubject().getId())
                .subjectName(topic.getSubject().getName())
                .state(stateRes.state())
                .trend(trend)
                .recentAveragePercentage(recentAveragePercentage)
                .historicalAveragePercentage(historicalAveragePercentage)
                .assessmentAttemptCount(attemptCount)
                .totalStudyMinutes(totalStudyMinutes)
                .studySessionCount(studySessionCount)
                .lastStudiedAt(lastStudiedAt)
                .lastAssessmentAt(lastAssessmentAt)
                .daysSinceLastStudied(daysSinceLastStudied)
                .daysSinceLastAssessment(daysSinceLastAssessment)
                .evidenceLevel(evidenceLevel)
                .reason(stateRes.reason())
                .build();
    }
}
