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
        // SQL 1: Topics with Subject eagerly loaded (JOIN FETCH — eliminates lazy Subject selects)
        List<Topic> topics;
        if (subjectIdFilter != null) {
            Subject subject = subjectRepository.findByIdAndUser(subjectIdFilter, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied: " + subjectIdFilter));
            topics = topicRepository.findAllWithSubjectBySubjectId(subject.getId());
        } else {
            topics = topicRepository.findAllWithSubjectByUserId(user.getId());
        }

        if (topics.isEmpty()) return Collections.emptyList();

        List<UUID> topicIds = topics.stream().map(Topic::getId).toList();

        // SQL 2: Bulk TopicProgress (IN clause — replaces 1 query per topic)
        Map<UUID, TopicProgress> progressMap =
                topicProgressRepository.findProgressMapByUserIdAndTopicIds(user.getId(), topicIds);

        // SQL 3: Bulk TopicAssessmentPerformance (IN clause, DESC order — replaces 1 query per topic)
        Map<UUID, List<TopicAssessmentPerformance>> performanceMap =
                topicPerformanceRepository.findPerformanceMapByUserIdAndTopicIds(user.getId(), topicIds);

        List<LearningStateResult> results = new ArrayList<>();
        for (Topic topic : topics) {
            LearningStateResult res = calculateTopicLearningStateInternal(topic, progressMap.get(topic.getId()), performanceMap.getOrDefault(topic.getId(), Collections.emptyList()));

            if (stateFilter != null && res.state() != stateFilter) continue;
            if (trendFilter != null && res.trend() != trendFilter) continue;
            if (evidenceFilter != null && res.evidenceLevel() != evidenceFilter) continue;

            results.add(res);
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectLearningStateSummary getSubjectLearningStateSummary(UUID subjectId, User user) {
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied: " + subjectId));

        // SQL 1: Topics with Subject JOIN FETCH
        List<Topic> topics = topicRepository.findAllWithSubjectBySubjectId(subject.getId());
        if (topics.isEmpty()) {
            return SubjectLearningStateSummary.builder().subjectId(subject.getId()).subjectName(subject.getName())
                    .totalTopics(0).strongCount(0).developingCount(0).weakCount(0).insufficientDataCount(0)
                    .topicResults(Collections.emptyList()).build();
        }

        List<UUID> topicIds = topics.stream().map(Topic::getId).toList();

        // SQL 2: Bulk TopicProgress
        Map<UUID, TopicProgress> progressMap =
                topicProgressRepository.findProgressMapByUserIdAndTopicIds(user.getId(), topicIds);

        // SQL 3: Bulk TopicAssessmentPerformance
        Map<UUID, List<TopicAssessmentPerformance>> performanceMap =
                topicPerformanceRepository.findPerformanceMapByUserIdAndTopicIds(user.getId(), topicIds);

        int strong = 0, developing = 0, weak = 0, insufficient = 0;
        List<LearningStateResult> topicResults = new ArrayList<>();

        for (Topic topic : topics) {
            LearningStateResult res = calculateTopicLearningStateInternal(topic, progressMap.get(topic.getId()), performanceMap.getOrDefault(topic.getId(), Collections.emptyList()));
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
        TopicProgress progress = topicProgressRepository.findByUserAndTopic(user, topic).orElse(null);
        List<TopicAssessmentPerformance> performances = topicPerformanceRepository.findByUserAndTopicIdOrderByEvaluatedAtDesc(user, topic.getId());
        return calculateTopicLearningStateInternal(topic, progress, performances);
    }

    private LearningStateResult calculateTopicLearningStateInternal(Topic topic, TopicProgress progress, List<TopicAssessmentPerformance> performances) {
        int totalStudyMinutes = progress != null ? progress.getTotalStudyMinutes() : 0;
        int studySessionCount = progress != null ? progress.getSessionCount() : 0;
        Instant lastStudiedAt = progress != null ? progress.getLastStudiedAt() : null;
        Long daysSinceLastStudied = lastStudiedAt != null ? Duration.between(lastStudiedAt, Instant.now()).toDays() : null;

        int attemptCount = performances.size();
        Instant lastAssessmentAt = attemptCount > 0 ? performances.get(0).getEvaluatedAt() : null;
        Long daysSinceLastAssessment = lastAssessmentAt != null ? Duration.between(lastAssessmentAt, Instant.now()).toDays() : null;

        Double recentAveragePercentage = null;
        Double historicalAveragePercentage = null;

        if (attemptCount > 0) {
            int recentWindow = Math.min(3, attemptCount);
            double recentSum = performances.subList(0, recentWindow).stream().mapToDouble(TopicAssessmentPerformance::getPercentage).sum();
            recentAveragePercentage = Math.round((recentSum / recentWindow) * 10.0) / 10.0;

            double totalSum = performances.stream().mapToDouble(TopicAssessmentPerformance::getPercentage).sum();
            historicalAveragePercentage = Math.round((totalSum / attemptCount) * 10.0) / 10.0;
        }

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
