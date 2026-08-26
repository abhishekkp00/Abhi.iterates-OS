package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.ExamCoverageResponse;
import com.abhiiterates.os.user.User;

import java.util.UUID;

public interface ExamCoverageService {
    ExamCoverageResponse calculateExamCoverage(UUID examId, User user);
}
