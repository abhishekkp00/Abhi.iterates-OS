package com.abhiiterates.os.productivity.service;

import com.abhiiterates.os.productivity.dto.PlannerSummaryResponse;
import com.abhiiterates.os.productivity.dto.TaskRequest;
import com.abhiiterates.os.productivity.dto.TaskResponse;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    
    List<TaskResponse> getAllTasks(User user);
    
    TaskResponse getTaskById(UUID id, User user);
    
    TaskResponse createTask(TaskRequest request, User user);
    
    TaskResponse updateTask(UUID id, TaskRequest request, User user);
    
    void deleteTask(UUID id, User user);

    PlannerSummaryResponse getPlannerSummary(User user);
}
