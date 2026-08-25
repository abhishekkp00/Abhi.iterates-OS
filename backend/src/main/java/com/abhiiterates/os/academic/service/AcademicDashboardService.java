package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.AcademicDashboardResponse;
import com.abhiiterates.os.user.User;

public interface AcademicDashboardService {
    AcademicDashboardResponse getDashboard(User user, String timeZoneId);
}
