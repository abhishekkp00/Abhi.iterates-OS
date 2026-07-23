package com.abhiiterates.os.productivity.controller;

import com.abhiiterates.os.common.ApiResponse;
import com.abhiiterates.os.productivity.dto.TaskRequest;
import com.abhiiterates.os.productivity.dto.TaskResponse;
import com.abhiiterates.os.productivity.service.TaskService;
import com.abhiiterates.os.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.abhiiterates.os.productivity.dto.PlannerSummaryResponse;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks(
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        List<TaskResponse> tasks = taskService.getAllTasks(user);
        return ResponseEntity.ok(ApiResponse.success(tasks, "Tasks retrieved successfully", request.getRequestURI()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PlannerSummaryResponse>> getPlannerSummary(
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        PlannerSummaryResponse summary = taskService.getPlannerSummary(user);
        return ResponseEntity.ok(ApiResponse.success(summary, "Planner summary retrieved successfully", request.getRequestURI()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        TaskResponse task = taskService.getTaskById(id, user);
        return ResponseEntity.ok(ApiResponse.success(task, "Task retrieved successfully", request.getRequestURI()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskRequest taskRequest,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        TaskResponse created = taskService.createTask(taskRequest, user);
        return ResponseEntity.ok(ApiResponse.success(created, "Task created successfully", request.getRequestURI()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest taskRequest,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        TaskResponse updated = taskService.updateTask(id, taskRequest, user);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task updated successfully", request.getRequestURI()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request
    ) {
        taskService.deleteTask(id, user);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", request.getRequestURI()));
    }
}
