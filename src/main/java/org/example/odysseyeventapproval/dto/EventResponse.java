package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.EventStage;

import java.time.Instant;

public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String studentName;
    private EventStage stage;
    private DecisionStatus saStatus;
    private DecisionStatus facultyStatus;
    private DecisionStatus deanStatus;
    private String saRemark;
    private String facultyRemark;
    private String deanRemark;
    private Instant createdAt;
    private Instant updatedAt;

    public static EventResponse from(Event event) {
        EventResponse response = new EventResponse();
        response.id = event.getId();
        response.title = event.getTitle();
        response.description = event.getDescription();
        response.studentName = event.getStudent().getDisplayName();
        response.stage = event.getStage();
        response.saStatus = event.getSaStatus();
        response.facultyStatus = event.getFacultyStatus();
        response.deanStatus = event.getDeanStatus();
        response.saRemark = event.getSaRemark();
        response.facultyRemark = event.getFacultyRemark();
        response.deanRemark = event.getDeanRemark();
        response.createdAt = event.getCreatedAt();
        response.updatedAt = event.getUpdatedAt();
        return response;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getStudentName() { return studentName; }
    public EventStage getStage() { return stage; }
    public DecisionStatus getSaStatus() { return saStatus; }
    public DecisionStatus getFacultyStatus() { return facultyStatus; }
    public DecisionStatus getDeanStatus() { return deanStatus; }
    public String getSaRemark() { return saRemark; }
    public String getFacultyRemark() { return facultyRemark; }
    public String getDeanRemark() { return deanRemark; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
