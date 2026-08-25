package com.abhiiterates.os.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SubmitAssessmentAttemptRequest {

    @NotEmpty(message = "Answers list cannot be empty")
    @Valid
    private List<StudentAnswerRequest> answers;

    public SubmitAssessmentAttemptRequest() {}

    public SubmitAssessmentAttemptRequest(List<StudentAnswerRequest> answers) {
        this.answers = answers;
    }

    public List<StudentAnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<StudentAnswerRequest> answers) { this.answers = answers; }
}
