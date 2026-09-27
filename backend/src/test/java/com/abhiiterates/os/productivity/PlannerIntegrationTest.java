package com.abhiiterates.os.productivity;

import com.abhiiterates.os.common.UserTestFactory;
import com.abhiiterates.os.productivity.domain.TaskPriority;
import com.abhiiterates.os.productivity.domain.TaskStatus;
import com.abhiiterates.os.productivity.dto.PlannerSummaryResponse;
import com.abhiiterates.os.productivity.dto.TaskRequest;
import com.abhiiterates.os.productivity.dto.TaskResponse;
import com.abhiiterates.os.productivity.service.TaskService;
import com.abhiiterates.os.user.User;
import com.abhiiterates.os.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PlannerIntegrationTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = UserTestFactory.createRegularUser("plannerTestUser");
        testUser = userRepository.save(testUser);
    }

    @Test
    void completeTaskLifecycle_createUpdateCompleteDelete_reflectsInPlannerSummary() {
        // 1. Create Task
        TaskRequest createReq = TaskRequest.builder()
                .title("Prepare Math Lecture Notes")
                .description("Chapter 4 Linear Algebra")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .category("ACADEMIC")
                .dueDate(Instant.now().plus(2, ChronoUnit.DAYS))
                .build();

        TaskResponse createdTask = taskService.createTask(createReq, testUser);
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.id()).isNotNull();
        assertThat(createdTask.status()).isEqualTo(TaskStatus.TODO);

        // Verify summary after create
        PlannerSummaryResponse summaryAfterCreate = taskService.getPlannerSummary(testUser);
        assertThat(summaryAfterCreate.totalTasks()).isEqualTo(1);
        assertThat(summaryAfterCreate.pendingTasks()).isEqualTo(1);
        assertThat(summaryAfterCreate.completedTasks()).isEqualTo(0);
        assertThat(summaryAfterCreate.highPriorityPendingCount()).isEqualTo(1);

        // 2. Update Task
        TaskRequest updateReq = TaskRequest.builder()
                .title("Prepare Math Lecture Notes & Solutions")
                .description("Chapter 4 Linear Algebra and Homework set 4")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.IN_PROGRESS)
                .category("ACADEMIC")
                .dueDate(Instant.now().plus(2, ChronoUnit.DAYS))
                .build();

        TaskResponse updatedTask = taskService.updateTask(createdTask.id(), updateReq, testUser);
        assertThat(updatedTask.title()).isEqualTo("Prepare Math Lecture Notes & Solutions");
        assertThat(updatedTask.status()).isEqualTo(TaskStatus.IN_PROGRESS);

        // 3. Complete Task
        TaskRequest completeReq = TaskRequest.builder()
                .title(updatedTask.title())
                .description(updatedTask.description())
                .priority(updatedTask.priority())
                .status(TaskStatus.COMPLETED)
                .category(updatedTask.category())
                .dueDate(updatedTask.dueDate())
                .build();

        TaskResponse completedTask = taskService.updateTask(createdTask.id(), completeReq, testUser);
        assertThat(completedTask.status()).isEqualTo(TaskStatus.COMPLETED);

        // Verify summary after completion
        PlannerSummaryResponse summaryAfterComplete = taskService.getPlannerSummary(testUser);
        assertThat(summaryAfterComplete.totalTasks()).isEqualTo(1);
        assertThat(summaryAfterComplete.completedTasks()).isEqualTo(1);
        assertThat(summaryAfterComplete.pendingTasks()).isEqualTo(0);
        assertThat(summaryAfterComplete.completionRate()).isEqualTo(100.0);
        assertThat(summaryAfterComplete.highPriorityPendingCount()).isEqualTo(0);

        // 4. Delete Task
        taskService.deleteTask(createdTask.id(), testUser);

        // Verify summary after deletion
        PlannerSummaryResponse summaryAfterDelete = taskService.getPlannerSummary(testUser);
        assertThat(summaryAfterDelete.totalTasks()).isEqualTo(0);
        assertThat(summaryAfterDelete.completedTasks()).isEqualTo(0);
        assertThat(summaryAfterDelete.pendingTasks()).isEqualTo(0);
        assertThat(summaryAfterDelete.completionRate()).isEqualTo(0.0);
    }
}
