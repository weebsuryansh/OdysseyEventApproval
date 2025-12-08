package org.example.odysseyeventapproval.dto;

import java.util.List;

public class EventRequest {
    private String title;
    private String description;
    private List<SubEventRequest> subEvents;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<SubEventRequest> getSubEvents() {
        return subEvents;
    }

    public void setSubEvents(List<SubEventRequest> subEvents) {
        this.subEvents = subEvents;
    }
}
