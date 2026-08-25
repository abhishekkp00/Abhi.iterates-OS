package com.abhiiterates.os.academic.dto;

public class CompleteStudySessionRequest {

    private String notes;

    public CompleteStudySessionRequest() {}

    public CompleteStudySessionRequest(String notes) {
        this.notes = notes;
    }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
