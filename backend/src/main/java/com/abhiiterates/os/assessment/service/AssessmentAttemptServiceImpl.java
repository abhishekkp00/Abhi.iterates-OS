package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.service.AcademicService;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.*;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentAttemptServiceImpl implements AssessmentAttemptService {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AssessmentAnswerRepository answerRepository;
    private final TopicAssessmentPerformanceRepository topicPerformanceRepository;
    private final AcademicService academicService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AssessmentAttemptResponse startAttempt(UUID assessmentId, User user) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + assessmentId));

        if (assessment.getStatus() != AssessmentStatus.PUBLISHED && !assessment.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Cannot start attempt on draft assessment owned by another user.");
        }

        if (assessment.getQuestionCount() == 0) {
            throw new IllegalStateException("Cannot start attempt on an assessment with 0 questions.");
        }

        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .user(user)
                .assessment(assessment)
                .startedAt(Instant.now())
                .status(AttemptStatus.IN_PROGRESS)
                .build();

        AssessmentAttempt saved = attemptRepository.save(attempt);
        log.info("Started assessment attempt [{}] for user [{}] assessment [{}]", saved.getId(), user.getId(), assessmentId);
        return mapAttemptToResponse(saved, Collections.emptyList());
    }

    @Override
    @Transactional
    public AssessmentAttemptResponse submitAttempt(UUID attemptId, SubmitAssessmentAttemptRequest request, User user) {
        AssessmentAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment attempt not found or access denied: " + attemptId));

        // Idempotency check: If already submitted, return existing results without re-scoring
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            log.warn("Assessment attempt [{}] was already submitted. Returning saved results.", attemptId);
            List<AssessmentAnswer> existingAnswers = answerRepository.findByAttemptId(attemptId);
            return mapAttemptToResponse(attempt, existingAnswers);
        }

        List<Question> questions = questionRepository.findByAssessmentIdOrderByQuestionOrderAsc(attempt.getAssessment().getId());
        Map<UUID, Question> questionMap = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));

        Map<UUID, StudentAnswerRequest> submittedAnswersMap = new HashMap<>();
        if (request != null && request.getAnswers() != null) {
            for (StudentAnswerRequest ansReq : request.getAnswers()) {
                submittedAnswersMap.put(ansReq.getQuestionId(), ansReq);
            }
        }

        double totalMarks = 0.0;
        double obtainedMarks = 0.0;
        int correctCount = 0;

        List<AssessmentAnswer> savedAnswers = new ArrayList<>();
        Map<Topic, List<AssessmentAnswer>> topicAnswersMap = new HashMap<>();

        Instant answeredAt = Instant.now();

        for (Question question : questions) {
            double qMarks = question.getMarks() != null ? question.getMarks() : 1.0;
            totalMarks += qMarks;

            StudentAnswerRequest ansReq = submittedAnswersMap.get(question.getId());
            if (ansReq == null || ansReq.getSelectedOptionId() == null) {
                // Unanswered question
                continue;
            }

            QuestionOption selectedOption = questionOptionRepository.findById(ansReq.getSelectedOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question option not found: " + ansReq.getSelectedOptionId()));

            if (!selectedOption.getQuestion().getId().equals(question.getId())) {
                throw new IllegalArgumentException("Selected option does not belong to question: " + question.getId());
            }

            boolean isCorrect = Boolean.TRUE.equals(selectedOption.getIsCorrect());
            double marksAwarded = isCorrect ? qMarks : 0.0;

            if (isCorrect) {
                correctCount++;
                obtainedMarks += marksAwarded;
            }

            AssessmentAnswer answer = AssessmentAnswer.builder()
                    .attempt(attempt)
                    .question(question)
                    .selectedOption(selectedOption)
                    .isCorrect(isCorrect)
                    .marksAwarded(marksAwarded)
                    .answeredAt(answeredAt)
                    .build();

            AssessmentAnswer savedAns = answerRepository.save(answer);
            savedAnswers.add(savedAns);

            if (question.getTopic() != null) {
                topicAnswersMap.computeIfAbsent(question.getTopic(), k -> new ArrayList<>()).add(savedAns);
            }
        }

        double percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100.0 : 0.0;
        percentage = Math.round(percentage * 100.0) / 100.0;

        attempt.setSubmittedAt(answeredAt);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setTotalMarks(totalMarks);
        attempt.setObtainedMarks(obtainedMarks);
        attempt.setPercentage(percentage);

        AssessmentAttempt submittedAttempt = attemptRepository.save(attempt);

        // Record Topic Assessment Performance
        Map<Topic, Double> topicPctMap = recordTopicPerformance(user, submittedAttempt, topicAnswersMap, answeredAt);

        log.info("Submitted assessment attempt [{}] for user [{}]: [{}/{}] marks ({}%)",
                attemptId, user.getId(), obtainedMarks, totalMarks, percentage);

        // Publish AssessmentSubmittedEvent for closed loop plan staleness evaluation
        try {
            eventPublisher.publishEvent(new com.abhiiterates.os.assessment.event.AssessmentSubmittedEvent(
                    this, user, submittedAttempt, topicPctMap
            ));
        } catch (Exception ex) {
            log.error("Failed to publish AssessmentSubmittedEvent for attempt [{}]: {}", attemptId, ex.getMessage(), ex);
        }

        return mapAttemptToResponse(submittedAttempt, savedAnswers);
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentAttemptResponse getAttemptById(UUID attemptId, User user) {
        AssessmentAttempt attempt = attemptRepository.findByIdAndUser(attemptId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment attempt not found or access denied: " + attemptId));

        List<AssessmentAnswer> answers = answerRepository.findByAttemptId(attemptId);
        return mapAttemptToResponse(attempt, answers);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AssessmentAttemptResponse> getUserAttempts(User user, Pageable pageable) {
        return attemptRepository.findByUserOrderByStartedAtDesc(user, pageable)
                .map(att -> mapAttemptToResponse(att, Collections.emptyList()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessmentAttemptResponse> getAssessmentAttempts(UUID assessmentId, User user) {
        return attemptRepository.findByUserAndAssessmentIdOrderByStartedAtDesc(user, assessmentId).stream()
                .map(att -> mapAttemptToResponse(att, Collections.emptyList()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TopicPerformanceResponse getTopicPerformance(UUID topicId, User user) {
        Topic topic = academicService.validateTopicOwnership(topicId, user);

        List<TopicAssessmentPerformance> performances = topicPerformanceRepository
                .findByUserAndTopicIdOrderByEvaluatedAtDesc(user, topicId);

        if (performances.isEmpty()) {
            return TopicPerformanceResponse.builder()
                    .topicId(topic.getId())
                    .topicName(topic.getName())
                    .subjectId(topic.getSubject().getId())
                    .subjectName(topic.getSubject().getName())
                    .totalAttempts(0)
                    .totalQuestionsAttempted(0)
                    .totalQuestionsCorrect(0)
                    .totalMarksObtained(0.0)
                    .totalMarksAvailable(0.0)
                    .averagePercentage(0.0)
                    .latestPercentage(0.0)
                    .lastEvaluatedAt(null)
                    .build();
        }

        int totalAttempts = performances.size();
        int totalQuestionsAttempted = performances.stream().mapToInt(TopicAssessmentPerformance::getQuestionsAttempted).sum();
        int totalQuestionsCorrect = performances.stream().mapToInt(TopicAssessmentPerformance::getQuestionsCorrect).sum();
        double totalMarksObtained = performances.stream().mapToDouble(TopicAssessmentPerformance::getMarksObtained).sum();
        double totalMarksAvailable = performances.stream().mapToDouble(TopicAssessmentPerformance::getMarksAvailable).sum();
        double avgPercentage = performances.stream().mapToDouble(TopicAssessmentPerformance::getPercentage).average().orElse(0.0);
        double latestPercentage = performances.get(0).getPercentage();

        return TopicPerformanceResponse.builder()
                .topicId(topic.getId())
                .topicName(topic.getName())
                .subjectId(topic.getSubject().getId())
                .subjectName(topic.getSubject().getName())
                .totalAttempts(totalAttempts)
                .totalQuestionsAttempted(totalQuestionsAttempted)
                .totalQuestionsCorrect(totalQuestionsCorrect)
                .totalMarksObtained(totalMarksObtained)
                .totalMarksAvailable(totalMarksAvailable)
                .averagePercentage(Math.round(avgPercentage * 100.0) / 100.0)
                .latestPercentage(latestPercentage)
                .lastEvaluatedAt(performances.get(0).getEvaluatedAt())
                .build();
    }

    private Map<Topic, Double> recordTopicPerformance(User user, AssessmentAttempt attempt, Map<Topic, List<AssessmentAnswer>> topicAnswersMap, Instant evaluatedAt) {
        Map<Topic, Double> pctMap = new HashMap<>();
        for (Map.Entry<Topic, List<AssessmentAnswer>> entry : topicAnswersMap.entrySet()) {
            Topic topic = entry.getKey();
            List<AssessmentAnswer> answers = entry.getValue();

            int qAttempted = answers.size();
            int qCorrect = (int) answers.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            double marksObtained = answers.stream().mapToDouble(AssessmentAnswer::getMarksAwarded).sum();
            double marksAvailable = answers.stream().mapToDouble(a -> a.getQuestion().getMarks()).sum();
            double pct = marksAvailable > 0 ? (marksObtained / marksAvailable) * 100.0 : 0.0;
            pct = Math.round(pct * 100.0) / 100.0;

            TopicAssessmentPerformance perf = TopicAssessmentPerformance.builder()
                    .user(user)
                    .topic(topic)
                    .attempt(attempt)
                    .questionsAttempted(qAttempted)
                    .questionsCorrect(qCorrect)
                    .marksObtained(marksObtained)
                    .marksAvailable(marksAvailable)
                    .percentage(pct)
                    .evaluatedAt(evaluatedAt)
                    .build();

            topicPerformanceRepository.save(perf);
            pctMap.put(topic, pct);
        }
        return pctMap;
    }

    private AssessmentAttemptResponse mapAttemptToResponse(AssessmentAttempt attempt, List<AssessmentAnswer> answers) {
        List<AssessmentAttemptResponse.AnswerResult> answerResults = answers.stream()
                .map(a -> AssessmentAttemptResponse.AnswerResult.builder()
                        .questionId(a.getQuestion().getId())
                        .questionText(a.getQuestion().getQuestionText())
                        .selectedOptionId(a.getSelectedOption() != null ? a.getSelectedOption().getId() : null)
                        .selectedOptionText(a.getSelectedOption() != null ? a.getSelectedOption().getOptionText() : null)
                        .isCorrect(a.getIsCorrect())
                        .marksAwarded(a.getMarksAwarded())
                        .questionMarks(a.getQuestion().getMarks())
                        .build())
                .toList();

        int correctCount = (int) answers.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();

        return AssessmentAttemptResponse.builder()
                .id(attempt.getId())
                .userId(attempt.getUser().getId())
                .assessmentId(attempt.getAssessment().getId())
                .assessmentTitle(attempt.getAssessment().getTitle())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus())
                .totalMarks(attempt.getTotalMarks())
                .obtainedMarks(attempt.getObtainedMarks())
                .percentage(attempt.getPercentage())
                .totalQuestions(attempt.getAssessment().getQuestionCount())
                .correctAnswersCount(correctCount)
                .answerResults(answerResults)
                .createdAt(attempt.getCreatedAt())
                .build();
    }
}
