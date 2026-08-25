package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.domain.TopicPrerequisite;
import com.abhiiterates.os.academic.dto.TopicPrerequisiteResponse;
import com.abhiiterates.os.academic.repository.TopicPrerequisiteRepository;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
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
public class TopicPrerequisiteServiceImpl implements TopicPrerequisiteService {

    private final TopicPrerequisiteRepository prerequisiteRepository;
    private final AcademicService academicService;

    @Override
    @Transactional
    public TopicPrerequisiteResponse addPrerequisite(UUID topicId, UUID prerequisiteTopicId, User user) {
        if (topicId.equals(prerequisiteTopicId)) {
            throw new BadRequestException("A topic cannot be its own prerequisite.");
        }

        // Both topics must be owned by the user
        Topic topic = academicService.validateTopicOwnership(topicId, user);
        Topic prerequisiteTopic = academicService.validateTopicOwnership(prerequisiteTopicId, user);

        // Idempotent check — return existing if already set
        var existing = prerequisiteRepository.findByTopicAndPrerequisiteTopic(topic, prerequisiteTopic);
        if (existing.isPresent()) {
            log.debug("[TopicPrerequisiteService] Prerequisite already exists: {} → {}", topicId, prerequisiteTopicId);
            return toResponse(existing.get());
        }

        TopicPrerequisite prerequisite = TopicPrerequisite.builder()
            .topic(topic)
            .prerequisiteTopic(prerequisiteTopic)
            .build();

        TopicPrerequisite saved = prerequisiteRepository.save(prerequisite);
        log.info("[TopicPrerequisiteService] Added prerequisite: topic [{}] requires [{}] for user [{}]",
            topic.getName(), prerequisiteTopic.getName(), user.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicPrerequisiteResponse> getPrerequisites(UUID topicId, User user) {
        Topic topic = academicService.validateTopicOwnership(topicId, user);
        return prerequisiteRepository.findByTopic(topic)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void removePrerequisite(UUID topicId, UUID prerequisiteTopicId, User user) {
        Topic topic = academicService.validateTopicOwnership(topicId, user);
        Topic prerequisiteTopic = academicService.validateTopicOwnership(prerequisiteTopicId, user);

        TopicPrerequisite edge = prerequisiteRepository
            .findByTopicAndPrerequisiteTopic(topic, prerequisiteTopic)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Prerequisite relationship not found between topic [" + topicId +
                "] and prerequisite [" + prerequisiteTopicId + "]"
            ));

        prerequisiteRepository.delete(edge);
        log.info("[TopicPrerequisiteService] Removed prerequisite: topic [{}] no longer requires [{}]",
            topic.getName(), prerequisiteTopic.getName());
    }

    private TopicPrerequisiteResponse toResponse(TopicPrerequisite edge) {
        return TopicPrerequisiteResponse.builder()
            .id(edge.getId())
            .topicId(edge.getTopic().getId())
            .topicName(edge.getTopic().getName())
            .prerequisiteTopicId(edge.getPrerequisiteTopic().getId())
            .prerequisiteTopicName(edge.getPrerequisiteTopic().getName())
            .subjectId(edge.getTopic().getSubject().getId())
            .subjectName(edge.getTopic().getSubject().getName())
            .build();
    }
}
