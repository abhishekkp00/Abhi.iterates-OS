package com.abhiiterates.os.assessment.service;

import com.abhiiterates.os.assessment.dto.*;
import com.abhiiterates.os.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AssessmentService {
    CreateAssessmentRequest.Response createAssessment(CreateAssessmentRequest request, User user);
    CreateAssessmentRequest.Response updateAssessment(UUID id, CreateAssessmentRequest request, User user);
    CreateAssessmentRequest.Response publishAssessment(UUID id, User user);
    
    CreateQuestionRequest.OwnerResponse addQuestion(UUID assessmentId, CreateQuestionRequest request, User user);
    List<CreateQuestionRequest.StudentResponse> getStudentQuestions(UUID assessmentId, User user);
    List<CreateQuestionRequest.OwnerResponse> getOwnerQuestions(UUID assessmentId, User user);
    
    CreateAssessmentRequest.Response getAssessmentById(UUID id, User user);
    Page<CreateAssessmentRequest.Response> getUserAssessments(User user, Pageable pageable);
    Page<CreateAssessmentRequest.Response> getPublishedAssessments(User user, Pageable pageable);
}
