package com.abhiiterates.os.productivity.service;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.productivity.domain.Task;
import com.abhiiterates.os.productivity.dto.PlannerSummaryResponse;
import com.abhiiterates.os.productivity.dto.TaskRequest;
import com.abhiiterates.os.productivity.dto.TaskResponse;
import com.abhiiterates.os.productivity.repository.TaskRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final com.abhiiterates.os.notification.service.NotificationService notificationService;

    @Override
    public List<TaskResponse> getAllTasks(User user) {
        return taskRepository.findAllByUser(user).stream()
            .map(TaskResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    public TaskResponse getTaskById(UUID id, User user) {
        Task task = taskRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return TaskResponse.fromEntity(task);
    }

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request, User user) {
        Task task = Task.builder()
            .title(request.title())
            .description(request.description())
            .status(request.status())
            .priority(request.priority())
            .category(request.category())
            .dueDate(request.dueDate())
            .user(user)
            .build();
        Task saved = taskRepository.save(task);
        
        try {
            notificationService.createNotification(
                    user,
                    com.abhiiterates.os.notification.domain.NotificationType.TASK_DUE_SOON,
                    "New task created: \"" + saved.getTitle() + "\"",
                    "/tasks",
                    saved.getId()
            );
        } catch (Exception ex) {
            // Keep task creation resilient to notification failures
        }

        return TaskResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID id, TaskRequest request, User user) {
        Task task = taskRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setCategory(request.category());
        task.setDueDate(request.dueDate());

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteTask(UUID id, User user) {
        Task task = taskRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        taskRepository.delete(task);
    }

    @Override
    public PlannerSummaryResponse getPlannerSummary(User user) {
        List<Task> tasks = taskRepository.findAllByUser(user);
        long total = tasks.size();
        long completed = tasks.stream().filter(t -> t.getStatus() == com.abhiiterates.os.productivity.domain.TaskStatus.COMPLETED).count();
        long pending = total - completed;
        double rate = total > 0 ? ((double) completed / total) * 100.0 : 0.0;
        
        long highPriorityPending = tasks.stream()
            .filter(t -> t.getStatus() != com.abhiiterates.os.productivity.domain.TaskStatus.COMPLETED && t.getPriority() == com.abhiiterates.os.productivity.domain.TaskPriority.HIGH)
            .count();

        Instant now = Instant.now();
        Instant sevenDaysLater = now.plus(7, java.time.temporal.ChronoUnit.DAYS);
        long upcomingDeadlines = tasks.stream()
            .filter(t -> t.getStatus() != com.abhiiterates.os.productivity.domain.TaskStatus.COMPLETED && t.getDueDate() != null &&
                         !t.getDueDate().isBefore(now) && t.getDueDate().isBefore(sevenDaysLater))
            .count();

        Instant endOfToday = now.plus(24, java.time.temporal.ChronoUnit.HOURS);
        long todayTasks = tasks.stream()
            .filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(now) && t.getDueDate().isBefore(endOfToday))
            .count();

        return PlannerSummaryResponse.builder()
            .totalTasks(total)
            .completedTasks(completed)
            .pendingTasks(pending)
            .completionRate(rate)
            .highPriorityPendingCount(highPriorityPending)
            .upcomingDeadlinesCount(upcomingDeadlines)
            .todayTasksCount(todayTasks)
            .build();
    }
}
