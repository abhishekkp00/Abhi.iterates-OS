package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.academic.domain.ExamStudyPhase;
import com.abhiiterates.os.academic.domain.LearningState;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.ExamCoverageResponse;
import com.abhiiterates.os.academic.dto.LearningStateResult;
import com.abhiiterates.os.academic.engine.ExamPhaseEngine;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.planner.engine.PriorityCalculator;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamCoverageServiceTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private ExamPhaseEngine examPhaseEngine;

    @Mock
    private PriorityCalculator priorityCalculator;

    @Mock
    private LearningStateService learningStateService;

    @InjectMocks
    private ExamCoverageServiceImpl coverageService;

    private User testUser;
    private Exam testExam;
    private Topic topic1;
    private Topic topic2;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("student@example.com").build();
        topic1 = Topic.builder().id(UUID.randomUUID()).name("Deadlocks").build();
        topic2 = Topic.builder().id(UUID.randomUUID()).name("Threads").build();

        testExam = Exam.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("OS Midterm")
                .examDate(LocalDate.now().plusDays(5))
                .topics(Set.of(topic1, topic2))
                .build();
    }

    @Test
    @DisplayName("Calculate factual exam coverage metrics and topic breakdowns")
    void calculate_exam_coverage_factual_metrics() {
        when(examRepository.findByIdAndUser(testExam.getId(), testUser)).thenReturn(Optional.of(testExam));
        when(examPhaseEngine.determineGlobalPhase(any(), any())).thenReturn(ExamStudyPhase.REVISION);
        when(priorityCalculator.calculateAll(testUser)).thenReturn(Collections.emptyList());

        LearningStateResult res1 = LearningStateResult.builder()
                .topicId(topic1.getId())
                .topicName("Deadlocks")
                .state(LearningState.WEAK)
                .totalStudyMinutes(120)
                .assessmentAttemptCount(2)
                .recentAveragePercentage(45.0)
                .build();

        LearningStateResult res2 = LearningStateResult.builder()
                .topicId(topic2.getId())
                .topicName("Threads")
                .state(LearningState.STRONG)
                .totalStudyMinutes(60)
                .assessmentAttemptCount(0)
                .recentAveragePercentage(90.0)
                .build();

        when(learningStateService.getUserTopicsLearningState(any(), any(), any(), any(), any()))
                .thenReturn(List.of(res1, res2));

        ExamCoverageResponse coverage = coverageService.calculateExamCoverage(testExam.getId(), testUser);

        assertThat(coverage).isNotNull();
        assertThat(coverage.globalPhase()).isEqualTo(ExamStudyPhase.REVISION);
        assertThat(coverage.totalTopicsCount()).isEqualTo(2);
        assertThat(coverage.studiedTopicsCount()).isEqualTo(2);
        assertThat(coverage.assessedTopicsCount()).isEqualTo(1);
        assertThat(coverage.studyCoveragePercentage()).isEqualTo(100.0);
        assertThat(coverage.assessmentCoveragePercentage()).isEqualTo(50.0);
        assertThat(coverage.weakTopicsCount()).isEqualTo(1);
        assertThat(coverage.strongTopicsCount()).isEqualTo(1);
    }
}
