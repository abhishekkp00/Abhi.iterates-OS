package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.domain.AcademicGoal;
import com.abhiiterates.os.academic.domain.Topic;
import com.abhiiterates.os.academic.dto.AcademicGoalRequest;
import com.abhiiterates.os.academic.repository.AcademicGoalRepository;
import com.abhiiterates.os.exception.BadRequestException;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicGoalServiceImpl implements AcademicGoalService {

    private final AcademicGoalRepository goalRepository;
    private final AcademicService academicService;

    @Override
    @Transactional
    public AcademicGoalRequest.Response createGoal(AcademicGoalRequest.Request request, User user) {
        Topic topic = academicService.validateTopicOwnership(request.topicId(), user);

        // Enforce one active goal per topic per user
        goalRepository.findByUserAndTopicAndIsActiveTrue(user, topic).ifPresent(existing -> {
            throw new BadRequestException(
                "An active goal already exists for topic '" + topic.getName() + "'. " +
                "Please deactivate it before creating a new one."
            );
        });

        AcademicGoal goal = AcademicGoal.builder()
            .user(user)
            .topic(topic)
            .targetState(request.targetState())
            .targetDate(request.targetDate())
            .description(request.description())
            .isActive(true)
            .build();

        AcademicGoal saved = goalRepository.save(goal);
        log.info("[AcademicGoalService] Created goal for topic [{}] (deadline: {}) by user [{}]",
            topic.getName(), request.targetDate(), user.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademicGoalRequest.Response> getActiveGoals(User user) {
        return goalRepository.findByUserAndIsActiveTrueOrderByTargetDateAsc(user)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public AcademicGoalRequest.Response updateGoal(UUID goalId, AcademicGoalRequest.Request request, User user) {
        AcademicGoal goal = goalRepository.findByIdAndUser(goalId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Goal not found or access denied: " + goalId));

        if (!goal.getIsActive()) {
            throw new BadRequestException("Cannot update an inactive goal. Create a new goal instead.");
        }

        // If topic is changing, validate ownership and check for duplicate active goal
        if (!goal.getTopic().getId().equals(request.topicId())) {
            Topic newTopic = academicService.validateTopicOwnership(request.topicId(), user);
            goalRepository.findByUserAndTopicAndIsActiveTrue(user, newTopic).ifPresent(existing -> {
                throw new BadRequestException(
                    "An active goal already exists for topic '" + newTopic.getName() + "'."
                );
            });
            goal.setTopic(newTopic);
        }

        goal.setTargetState(request.targetState());
        goal.setTargetDate(request.targetDate());
        goal.setDescription(request.description());

        AcademicGoal updated = goalRepository.save(goal);
        log.info("[AcademicGoalService] Updated goal [{}] for user [{}]", goalId, user.getId());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deactivateGoal(UUID goalId, User user) {
        AcademicGoal goal = goalRepository.findByIdAndUser(goalId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Goal not found or access denied: " + goalId));

        goal.setIsActive(false);
        goalRepository.save(goal);
        log.info("[AcademicGoalService] Deactivated goal [{}] for user [{}]", goalId, user.getId());
    }

    private AcademicGoalRequest.Response toResponse(AcademicGoal goal) {
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
        return AcademicGoalRequest.Response.builder()
            .id(goal.getId())
            .topicId(goal.getTopic().getId())
            .topicName(goal.getTopic().getName())
            .subjectId(goal.getTopic().getSubject().getId())
            .subjectName(goal.getTopic().getSubject().getName())
            .targetState(goal.getTargetState())
            .targetDate(goal.getTargetDate())
            .description(goal.getDescription())
            .isActive(goal.getIsActive())
            .daysRemaining(daysRemaining)
            .createdAt(goal.getCreatedAt())
            .updatedAt(goal.getUpdatedAt())
            .build();
    }
}
