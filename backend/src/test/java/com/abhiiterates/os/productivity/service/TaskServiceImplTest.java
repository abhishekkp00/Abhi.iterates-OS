package com.abhiiterates.os.productivity.service;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.notification.service.NotificationService;
import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import com.abhiiterates.os.productivity.dto.PlannerSummaryResponse;
import com.abhiiterates.os.productivity.dto.TaskRequest;
import com.abhiiterates.os.productivity.dto.TaskResponse;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TaskServiceImpl taskService;

    private User userA;
    private User userB;
    private Task taskA;
    private TaskRequest taskRequest;

    @BeforeEach
    void setUp() {
        userA = UserTestFactory.createRegularUser("taskUserA");
        userB = UserTestFactory.createRegularUser("taskUserB");

        taskA = Task.builder()
                .id(UUID.randomUUID())
                .title("Complete Assignment 1")
                .description("Math 101 homework")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .category("STUDY")
                .user(userA)
                .build();

        taskRequest = new TaskRequest(
                "Complete Assignment 1",
                "Math 101 homework",
                TaskStatus.IN_PROGRESS,
                TaskPriority.HIGH,
                "STUDY",
                null
        );
    }

    @Test
    void createTask_withValidRequest_savesAndReturnsTaskResponse() {
        when(taskRepository.save(any(Task.class))).thenReturn(taskA);

        TaskResponse response = taskService.createTask(taskRequest, userA);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Complete Assignment 1");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void getTaskById_ownedByCurrentUser_returnsTask() {
        when(taskRepository.findByIdAndUser(taskA.getId(), userA)).thenReturn(Optional.of(taskA));

        TaskResponse response = taskService.getTaskById(taskA.getId(), userA);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(taskA.getId());
    }

    @Test
    void getTaskById_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(taskRepository.findByIdAndUser(taskA.getId(), userB)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(taskA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTask_ownedByAnotherUser_throwsResourceNotFoundException() {
        when(taskRepository.findByIdAndUser(taskA.getId(), userB)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(taskA.getId(), userB))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(taskRepository, never()).delete(any());
    }

    @Test
    void getPlannerSummary_calculatesCompletionRateAndCounts() {
        Task completed = Task.builder()
                .id(UUID.randomUUID())
                .title("Finished Task")
                .status(TaskStatus.COMPLETED)
                .priority(TaskPriority.MEDIUM)
                .user(userA)
                .build();

        when(taskRepository.findAllByUser(userA)).thenReturn(List.of(taskA, completed));

        PlannerSummaryResponse summary = taskService.getPlannerSummary(userA);

        assertThat(summary.totalTasks()).isEqualTo(2);
        assertThat(summary.completedTasks()).isEqualTo(1);
        assertThat(summary.pendingTasks()).isEqualTo(1);
        assertThat(summary.completionRate()).isEqualTo(50.0);
        assertThat(summary.highPriorityPendingCount()).isEqualTo(1);
    }
}
