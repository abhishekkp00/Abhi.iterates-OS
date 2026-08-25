package com.abhiiterates.os.academic.service;

import com.abhiiterates.os.academic.dto.ExamRequest;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface ExamService {
    ExamRequest.Response createExam(ExamRequest request, User user);
    List<ExamRequest.Response> getUserExams(User user);
    ExamRequest.Response getExamById(UUID examId, User user);
    ExamRequest.Response updateExam(UUID examId, ExamRequest request, User user);
    void deleteExam(UUID examId, User user);
}
