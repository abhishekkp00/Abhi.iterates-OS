package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Exam;
import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.ExamRequest;
import com.abhiiterates.os.academic.repository.ExamRepository;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.assessment.repository.TopicAssessmentPerformanceRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final TopicAssessmentPerformanceRepository topicAssessmentPerformanceRepository;

    @Override
    @Transactional
    public ExamRequest.Response createExam(ExamRequest request, User user) {
        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + request.getSubjectId()));
        }

        Set<Topic> topics = resolveTopics(request.getTopicIds());

        Exam exam = Exam.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .examDate(request.getExamDate())
                .topics(topics)
                .build();

        Exam saved = examRepository.save(exam);
        Set<UUID> assessedTopicIds = new HashSet<>(topicAssessmentPerformanceRepository.findAssessedTopicIdsByUser(user));
        return mapToResponse(saved, assessedTopicIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamRequest.Response> getUserExams(User user) {
        List<Exam> exams = examRepository.findByUserOrderByExamDateAsc(user);
        Set<UUID> assessedTopicIds = new HashSet<>(topicAssessmentPerformanceRepository.findAssessedTopicIdsByUser(user));

        return exams.stream()
                .map(exam -> mapToResponse(exam, assessedTopicIds))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamRequest.Response getExamById(UUID examId, User user) {
        Exam exam = examRepository.findByIdAndUser(examId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with ID: " + examId));

        Set<UUID> assessedTopicIds = new HashSet<>(topicAssessmentPerformanceRepository.findAssessedTopicIdsByUser(user));
        return mapToResponse(exam, assessedTopicIds);
    }

    @Override
    @Transactional
    public ExamRequest.Response updateExam(UUID examId, ExamRequest request, User user) {
        Exam exam = examRepository.findByIdAndUser(examId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with ID: " + examId));

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + request.getSubjectId()));
            exam.setSubject(subject);
        } else {
            exam.setSubject(null);
        }

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setExamDate(request.getExamDate());

        if (request.getTopicIds() != null) {
            exam.setTopics(resolveTopics(request.getTopicIds()));
        }

        Exam updated = examRepository.save(exam);
        Set<UUID> assessedTopicIds = new HashSet<>(topicAssessmentPerformanceRepository.findAssessedTopicIdsByUser(user));
        return mapToResponse(updated, assessedTopicIds);
    }

    @Override
    @Transactional
    public void deleteExam(UUID examId, User user) {
        Exam exam = examRepository.findByIdAndUser(examId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with ID: " + examId));
        examRepository.delete(exam);
    }

    private Set<Topic> resolveTopics(List<UUID> topicIds) {
        if (topicIds == null || topicIds.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(topicRepository.findAllById(topicIds));
    }

    private ExamRequest.Response mapToResponse(Exam exam, Set<UUID> assessedTopicIds) {
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), exam.getExamDate());
        int totalTopics = exam.getTopics() != null ? exam.getTopics().size() : 0;

        int assessedCount = 0;
        if (totalTopics > 0 && exam.getTopics() != null) {
            assessedCount = (int) exam.getTopics().stream()
                    .filter(t -> assessedTopicIds.contains(t.getId()))
                    .count();
        }

        double coveragePercentage = totalTopics > 0
                ? Math.round(((double) assessedCount / totalTopics * 100.0) * 10.0) / 10.0
                : 0.0;

        List<UUID> topicIdList = exam.getTopics() != null
                ? exam.getTopics().stream().map(Topic::getId).collect(Collectors.toList())
                : Collections.emptyList();

        return ExamRequest.Response.builder()
                .id(exam.getId())
                .userId(exam.getUser().getId())
                .subjectId(exam.getSubject() != null ? exam.getSubject().getId() : null)
                .subjectName(exam.getSubject() != null ? exam.getSubject().getName() : null)
                .title(exam.getTitle())
                .description(exam.getDescription())
                .examDate(exam.getExamDate())
                .daysRemaining(daysRemaining)
                .totalTopicsCount(totalTopics)
                .assessedTopicsCount(assessedCount)
                .assessmentCoveragePercentage(coveragePercentage)
                .topicIds(topicIdList)
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }
}
