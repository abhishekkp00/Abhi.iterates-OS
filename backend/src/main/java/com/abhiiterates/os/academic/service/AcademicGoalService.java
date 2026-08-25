package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.AcademicGoalRequest;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface AcademicGoalService {

    AcademicGoalRequest.Response createGoal(AcademicGoalRequest.Request request, User user);

    List<AcademicGoalRequest.Response> getActiveGoals(User user);

    AcademicGoalRequest.Response updateGoal(UUID goalId, AcademicGoalRequest.Request request, User user);

    void deactivateGoal(UUID goalId, User user);
}
