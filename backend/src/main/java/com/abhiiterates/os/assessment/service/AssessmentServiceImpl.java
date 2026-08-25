package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.assessment.domain.*;
import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.assessment.repository.AssessmentRepository;
import com.abhiiterates.os.assessment.repository.QuestionOptionRepository;
import com.abhiiterates.os.assessment.repository.QuestionRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentServiceImpl implements AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;

    @Override
    @Transactional
    public CreateAssessmentRequest.Response createAssessment(CreateAssessmentRequest request, User user) {
        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                    .orElseThrow(() -> new UnauthorizedException("Subject not found or does not belong to authenticated user: " + request.getSubjectId()));
        }

        Set<Topic> topics = new HashSet<>();
        if (request.getTopicIds() != null && !request.getTopicIds().isEmpty()) {
            for (UUID topicId : request.getTopicIds()) {
                Topic topic = topicRepository.findByIdAndUserId(topicId, user.getId())
                        .orElseThrow(() -> new UnauthorizedException("Topic not found or does not belong to authenticated user: " + topicId));
                topics.add(topic);
            }
        }

        Assessment assessment = Assessment.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .status(AssessmentStatus.DRAFT)
                .questionCount(0)
                .durationMinutes(request.getDurationMinutes())
                .topics(topics)
                .build();

        Assessment saved = assessmentRepository.save(assessment);
        log.info("Created draft assessment [{}] for user [{}]", saved.getTitle(), user.getId());
        return mapAssessmentToResponse(saved);
    }

    @Override
    @Transactional
    public CreateAssessmentRequest.Response updateAssessment(UUID id, CreateAssessmentRequest request, User user) {
        Assessment assessment = assessmentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found or access denied: " + id));

        if (assessment.getStatus() == AssessmentStatus.PUBLISHED) {
            throw new IllegalStateException("Published assessments are immutable and cannot be edited. Create a new version.");
        }

        assessment.setTitle(request.getTitle().trim());
        assessment.setDescription(request.getDescription());
        assessment.setDurationMinutes(request.getDurationMinutes());

        Assessment saved = assessmentRepository.save(assessment);
        return mapAssessmentToResponse(saved);
    }

    @Override
    @Transactional
    public CreateAssessmentRequest.Response publishAssessment(UUID id, User user) {
        Assessment assessment = assessmentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found or access denied: " + id));

        if (assessment.getQuestionCount() == 0) {
            throw new IllegalStateException("Cannot publish an assessment with 0 questions. Add at least one question.");
        }

        assessment.setStatus(AssessmentStatus.PUBLISHED);
        Assessment published = assessmentRepository.save(assessment);
        log.info("Published assessment [{}] with [{}] questions for user [{}]", published.getId(), published.getQuestionCount(), user.getId());
        return mapAssessmentToResponse(published);
    }

    @Override
    @Transactional
    public CreateQuestionRequest.OwnerResponse addQuestion(UUID assessmentId, CreateQuestionRequest request, User user) {
        Assessment assessment = assessmentRepository.findByIdAndUser(assessmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found or access denied: " + assessmentId));

        if (assessment.getStatus() == AssessmentStatus.PUBLISHED) {
            throw new IllegalStateException("Published assessments are immutable. Cannot add questions to a published assessment.");
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findByIdAndUserId(request.getTopicId(), user.getId())
                    .orElseThrow(() -> new UnauthorizedException("Question topic not found or access denied: " + request.getTopicId()));
        }

        // Validate at least one correct option exists
        boolean hasCorrect = request.getOptions().stream().anyMatch(opt -> Boolean.TRUE.equals(opt.getIsCorrect()));
        if (!hasCorrect) {
            throw new IllegalArgumentException("Question must have at least one correct option.");
        }

        Question question = Question.builder()
                .assessment(assessment)
                .topic(topic)
                .questionText(request.getQuestionText().trim())
                .questionType(request.getQuestionType() != null ? request.getQuestionType() : QuestionType.MULTIPLE_CHOICE)
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : QuestionDifficulty.MEDIUM)
                .marks(request.getMarks() != null && request.getMarks() > 0 ? request.getMarks() : 1.0)
                .questionOrder(request.getQuestionOrder())
                .build();

        List<QuestionOption> options = new ArrayList<>();
        for (CreateQuestionOptionRequest optReq : request.getOptions()) {
            options.add(QuestionOption.builder()
                    .question(question)
                    .optionText(optReq.getOptionText().trim())
                    .optionOrder(optReq.getOptionOrder())
                    .isCorrect(Boolean.TRUE.equals(optReq.getIsCorrect()))
                    .build());
        }

        question.setOptions(options);
        Question saved = questionRepository.save(question);

        // Update question count on assessment
        assessment.setQuestionCount(assessment.getQuestionCount() + 1);
        assessmentRepository.save(assessment);

        log.info("Added question [{}] to assessment [{}]", saved.getId(), assessmentId);
        return mapQuestionToOwnerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreateQuestionRequest.StudentResponse> getStudentQuestions(UUID assessmentId, User user) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + assessmentId));

        if (assessment.getStatus() != AssessmentStatus.PUBLISHED && !assessment.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Draft assessments can only be viewed by the owner.");
        }

        return questionRepository.findByAssessmentIdOrderByQuestionOrderAsc(assessmentId).stream()
                .map(this::mapQuestionToStudentResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreateQuestionRequest.OwnerResponse> getOwnerQuestions(UUID assessmentId, User user) {
        Assessment assessment = assessmentRepository.findByIdAndUser(assessmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found or access denied: " + assessmentId));

        return questionRepository.findByAssessmentIdOrderByQuestionOrderAsc(assessment.getId()).stream()
                .map(this::mapQuestionToOwnerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CreateAssessmentRequest.Response getAssessmentById(UUID id, User user) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found: " + id));

        if (assessment.getStatus() != AssessmentStatus.PUBLISHED && !assessment.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Draft assessments can only be accessed by the owner.");
        }

        return mapAssessmentToResponse(assessment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreateAssessmentRequest.Response> getUserAssessments(User user, Pageable pageable) {
        return assessmentRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::mapAssessmentToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreateAssessmentRequest.Response> getPublishedAssessments(User user, Pageable pageable) {
        return assessmentRepository.findByUserAndStatusOrderByCreatedAtDesc(user, AssessmentStatus.PUBLISHED, pageable)
                .map(this::mapAssessmentToResponse);
    }

    private CreateAssessmentRequest.Response mapAssessmentToResponse(Assessment assessment) {
        List<UUID> topicIds = assessment.getTopics() != null
                ? assessment.getTopics().stream().map(Topic::getId).toList()
                : Collections.emptyList();

        return CreateAssessmentRequest.Response.builder()
                .id(assessment.getId())
                .userId(assessment.getUser().getId())
                .subjectId(assessment.getSubject() != null ? assessment.getSubject().getId() : null)
                .subjectName(assessment.getSubject() != null ? assessment.getSubject().getName() : null)
                .title(assessment.getTitle())
                .description(assessment.getDescription())
                .status(assessment.getStatus())
                .questionCount(assessment.getQuestionCount())
                .durationMinutes(assessment.getDurationMinutes())
                .topicIds(topicIds)
                .createdAt(assessment.getCreatedAt())
                .updatedAt(assessment.getUpdatedAt())
                .build();
    }

    private CreateQuestionRequest.StudentResponse mapQuestionToStudentResponse(Question q) {
        List<CreateQuestionOptionRequest.StudentResponse> optResponses = q.getOptions().stream()
                .map(o -> CreateQuestionOptionRequest.StudentResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .optionOrder(o.getOptionOrder())
                        .build()) // CRITICAL: NO isCorrect RETURNED TO STUDENT!
                .toList();

        return CreateQuestionRequest.StudentResponse.builder()
                .id(q.getId())
                .assessmentId(q.getAssessment().getId())
                .topicId(q.getTopic() != null ? q.getTopic().getId() : null)
                .topicName(q.getTopic() != null ? q.getTopic().getName() : null)
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .difficulty(q.getDifficulty())
                .marks(q.getMarks())
                .questionOrder(q.getQuestionOrder())
                .options(optResponses)
                .createdAt(q.getCreatedAt())
                .build();
    }

    private CreateQuestionRequest.OwnerResponse mapQuestionToOwnerResponse(Question q) {
        List<CreateQuestionOptionRequest.OwnerResponse> optResponses = q.getOptions().stream()
                .map(o -> CreateQuestionOptionRequest.OwnerResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .optionOrder(o.getOptionOrder())
                        .isCorrect(o.getIsCorrect())
                        .build())
                .toList();

        return CreateQuestionRequest.OwnerResponse.builder()
                .id(q.getId())
                .assessmentId(q.getAssessment().getId())
                .topicId(q.getTopic() != null ? q.getTopic().getId() : null)
                .topicName(q.getTopic() != null ? q.getTopic().getName() : null)
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .difficulty(q.getDifficulty())
                .marks(q.getMarks())
                .questionOrder(q.getQuestionOrder())
                .options(optResponses)
                .createdAt(q.getCreatedAt())
                .build();
    }
}
