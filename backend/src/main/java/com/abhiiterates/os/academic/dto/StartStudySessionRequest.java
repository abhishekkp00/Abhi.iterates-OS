package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.StudySessionType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class StartStudySessionRequest {

    @NotNull(message = "Topic ID is required")
    private UUID topicId;

    private StudySessionType sessionType;
    private String notes;

    public StartStudySessionRequest() {}

    public StartStudySessionRequest(UUID topicId, StudySessionType sessionType, String notes) {
        this.topicId = topicId;
        this.sessionType = sessionType;
        this.notes = notes;
    }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public StudySessionType getSessionType() { return sessionType; }
    public void setSessionType(StudySessionType sessionType) { this.sessionType = sessionType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
