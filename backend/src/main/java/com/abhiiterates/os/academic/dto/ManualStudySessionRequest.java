package com.abhiiterates.os.academic.dto;

import com.abhiiterates.os.academic.domain.StudySessionType;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public class ManualStudySessionRequest {

    @NotNull(message = "Topic ID is required")
    private UUID topicId;

    private StudySessionType sessionType;

    @NotNull(message = "Start timestamp is required")
    private Instant startedAt;

    @NotNull(message = "End timestamp is required")
    private Instant endedAt;

    private String notes;

    public ManualStudySessionRequest() {}

    public ManualStudySessionRequest(UUID topicId, StudySessionType sessionType, Instant startedAt, Instant endedAt, String notes) {
        this.topicId = topicId;
        this.sessionType = sessionType;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.notes = notes;
    }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public StudySessionType getSessionType() { return sessionType; }
    public void setSessionType(StudySessionType sessionType) { this.sessionType = sessionType; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
