package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Subject;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.SubjectRequest;
import com.abhiiterates.os.academic.dto.TopicRequest;
import com.abhiiterates.os.academic.repository.SubjectRepository;
import com.abhiiterates.os.academic.repository.TopicRepository;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.exception.UnauthorizedException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicServiceImpl implements AcademicService {

    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;

    @Override
    @Transactional
    public SubjectRequest.Response createSubject(SubjectRequest request, User user) {
        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName().trim())
                .code(request.getCode() != null ? request.getCode().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : "#3B82F6")
                .description(request.getDescription())
                .build();

        Subject saved = subjectRepository.save(subject);
        log.info("Created subject [{}] for user [{}]", saved.getName(), user.getId());
        return mapSubjectToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectRequest.Response> getUserSubjects(User user) {
        return subjectRepository.findByUserOrderByNameAsc(user).stream()
                .map(this::mapSubjectToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectRequest.Response getSubjectById(UUID subjectId, User user) {
        Subject subject = subjectRepository.findByIdAndUser(subjectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied: " + subjectId));
        return mapSubjectToResponse(subject);
    }

    @Override
    @Transactional
    public TopicRequest.Response createTopic(TopicRequest request, User user) {
        Subject subject = subjectRepository.findByIdAndUser(request.getSubjectId(), user)
                .orElseThrow(() -> new UnauthorizedException("Subject not found or does not belong to authenticated user: " + request.getSubjectId()));

        Topic topic = Topic.builder()
                .subject(subject)
                .name(request.getName().trim())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .build();

        Topic saved = topicRepository.save(topic);
        log.info("Created topic [{}] in subject [{}] for user [{}]", saved.getName(), subject.getName(), user.getId());
        return mapTopicToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicRequest.Response> getTopicsBySubject(UUID subjectId, User user) {
        return topicRepository.findBySubjectIdAndUserId(subjectId, user.getId()).stream()
                .map(this::mapTopicToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Topic validateTopicOwnership(UUID topicId, User user) {
        return topicRepository.findByIdAndUserId(topicId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("Topic not found or does not belong to authenticated user: " + topicId));
    }

    private SubjectRequest.Response mapSubjectToResponse(Subject subject) {
        return SubjectRequest.Response.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .color(subject.getColor())
                .description(subject.getDescription())
                .createdAt(subject.getCreatedAt())
                .updatedAt(subject.getUpdatedAt())
                .build();
    }

    private TopicRequest.Response mapTopicToResponse(Topic topic) {
        return TopicRequest.Response.builder()
                .id(topic.getId())
                .subjectId(topic.getSubject().getId())
                .subjectName(topic.getSubject().getName())
                .name(topic.getName())
                .description(topic.getDescription())
                .orderIndex(topic.getOrderIndex())
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .build();
    }
}
