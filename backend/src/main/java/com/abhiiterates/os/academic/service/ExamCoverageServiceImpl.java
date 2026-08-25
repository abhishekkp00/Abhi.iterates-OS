package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.ExamCoverageResponse;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.engine.ExamPhaseEngine;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.planner.engine.PriorityCalculator;
import com.abhiiterates.os.planner.engine.TopicPriorityFactor;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamCoverageServiceImpl implements ExamCoverageService {

    private final ExamRepository examRepository;
    private final ExamPhaseEngine examPhaseEngine;
    private final PriorityCalculator priorityCalculator;
    private final LearningStateService learningStateService;

    @Override
    @Transactional(readOnly = true)
    public ExamCoverageResponse calculateExamCoverage(UUID examId, User user) {
        Exam exam = examRepository.findByIdAndUser(examId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with ID: " + examId));

        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, exam.getExamDate());
        ExamStudyPhase globalPhase = examPhaseEngine.determineGlobalPhase(exam.getExamDate(), today);

        Set<Topic> topics = exam.getTopics() != null ? exam.getTopics() : Collections.emptySet();
        int totalTopicsCount = topics.size();

        if (totalTopicsCount == 0) {
            return ExamCoverageResponse.builder()
                    .examId(exam.getId())
                    .examTitle(exam.getTitle())
                    .examDate(exam.getExamDate())
                    .daysRemaining(daysRemaining)
                    .globalPhase(globalPhase)
                    .totalTopicsCount(0)
                    .studiedTopicsCount(0)
                    .assessedTopicsCount(0)
                    .studyCoveragePercentage(0.0)
                    .assessmentCoveragePercentage(0.0)
                    .weakTopicsCount(0)
                    .developingTopicsCount(0)
                    .strongTopicsCount(0)
                    .insufficientDataTopicsCount(0)
                    .recommendedStrategySummary("No topics linked to this exam yet.")
                    .topicBreakdown(Collections.emptyList())
                    .build();
        }

        // Fetch priority factor breakdowns for user topics
        List<TopicPriorityFactor> allFactors = priorityCalculator.calculateAll(user);
        Map<UUID, TopicPriorityFactor> factorMap = new HashMap<>();
        for (TopicPriorityFactor f : allFactors) {
            factorMap.put(f.topicId(), f);
        }

        // Fetch learning states
        List<UUID> examTopicIds = topics.stream().map(Topic::getId).toList();
        List<LearningStateResult> stateResults = learningStateService.getUserTopicsLearningState(user, null, null, null, null);
        Map<UUID, LearningStateResult> stateMap = new HashMap<>();
        for (LearningStateResult r : stateResults) {
            stateMap.put(r.topicId(), r);
        }

        int studiedCount = 0;
        int assessedCount = 0;
        int weakCount = 0;
        int developingCount = 0;
        int strongCount = 0;
        int insufficientDataCount = 0;

        List<ExamCoverageResponse.ExamTopicBreakdownItem> breakdownItems = new ArrayList<>();

        for (Topic topic : topics) {
            LearningStateResult stateRes = stateMap.get(topic.getId());
            TopicPriorityFactor factor = factorMap.get(topic.getId());

            int studyMins = stateRes != null && stateRes.totalStudyMinutes() != null ? stateRes.totalStudyMinutes() : 0;
            int attemptCount = stateRes != null && stateRes.assessmentAttemptCount() != null ? stateRes.assessmentAttemptCount() : 0;
            LearningState ls = stateRes != null && stateRes.state() != null ? stateRes.state() : LearningState.INSUFFICIENT_DATA;

            if (studyMins > 0) studiedCount++;
            if (attemptCount > 0) assessedCount++;

            switch (ls) {
                case WEAK -> weakCount++;
                case DEVELOPING -> developingCount++;
                case STRONG -> strongCount++;
                case INSUFFICIENT_DATA -> insufficientDataCount++;
            }

            double priorityScore = factor != null ? factor.rawScore() : 0.0;
            String reason = factor != null ? factor.reason() : "Exam target topic";
            var strategy = factor != null ? factor.recommendedStrategy() : com.abhiiterates.os.academic.domain.StudySessionType.STUDY;

            breakdownItems.add(ExamCoverageResponse.ExamTopicBreakdownItem.builder()
                    .topicId(topic.getId())
                    .topicName(topic.getName())
                    .subjectId(topic.getSubject() != null ? topic.getSubject().getId() : null)
                    .subjectName(topic.getSubject() != null ? topic.getSubject().getName() : null)
                    .learningState(ls)
                    .trend(stateRes != null ? stateRes.trend() : com.abhiiterates.os.academic.domain.LearningTrend.INSUFFICIENT_DATA)
                    .studyMinutes(studyMins)
                    .recentAccuracyPercentage(stateRes != null ? stateRes.recentAveragePercentage() : null)
                    .assessmentAttemptCount(attemptCount)
                    .recommendedStrategy(strategy)
                    .topicPhase(globalPhase)
                    .priorityScore(priorityScore)
                    .reason(reason)
                    .build());
        }

        // Sort breakdown by priority score descending
        breakdownItems.sort(Comparator.comparingDouble(ExamCoverageResponse.ExamTopicBreakdownItem::priorityScore).reversed());

        double studyCoverage = Math.round(((double) studiedCount / totalTopicsCount * 100.0) * 10.0) / 10.0;
        double assessmentCoverage = Math.round(((double) assessedCount / totalTopicsCount * 100.0) * 10.0) / 10.0;

        String summary = String.format("%s Phase (%d days left): %d weak, %d developing, %d strong topics.",
                globalPhase.name(), Math.max(0, daysRemaining), weakCount, developingCount, strongCount);

        return ExamCoverageResponse.builder()
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .examDate(exam.getExamDate())
                .daysRemaining(daysRemaining)
                .globalPhase(globalPhase)
                .totalTopicsCount(totalTopicsCount)
                .studiedTopicsCount(studiedCount)
                .assessedTopicsCount(assessedCount)
                .studyCoveragePercentage(studyCoverage)
                .assessmentCoveragePercentage(assessmentCoverage)
                .weakTopicsCount(weakCount)
                .developingTopicsCount(developingCount)
                .strongTopicsCount(strongCount)
                .insufficientDataTopicsCount(insufficientDataCount)
                .recommendedStrategySummary(summary)
                .topicBreakdown(breakdownItems)
                .build();
    }
}
