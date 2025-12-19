package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.SubEvent;

public class PocRequestResponse {
    private Long subEventId;
    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private String subEventName;
    private String budgetHead;
    private String budgetBreakdown;
    private String pocName;
    private String pocPhone;
    private String status;
    private String requestedBy;

    public static PocRequestResponse from(SubEvent subEvent) {
        PocRequestResponse response = new PocRequestResponse();
        response.subEventId = subEvent.getId();
        response.eventId = subEvent.getEvent().getId();
        response.eventTitle = subEvent.getEvent().getTitle();
        response.eventDescription = subEvent.getEvent().getDescription();
        response.subEventName = subEvent.getName();
        response.budgetHead = subEvent.getBudgetHead();
        response.budgetBreakdown = subEvent.getBudgetBreakdown();
        response.pocName = subEvent.getPocName();
        response.pocPhone = subEvent.getPocPhone();
        response.status = subEvent.getPocStatus().name();
        response.requestedBy = subEvent.getEvent().getStudent().getDisplayName();
        return response;
    }

    public Long getSubEventId() {
        return subEventId;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public String getSubEventName() {
        return subEventName;
    }

    public String getBudgetHead() {
        return budgetHead;
    }

    public String getBudgetBreakdown() {
        return budgetBreakdown;
    }

    public String getPocName() {
        return pocName;
    }

    public String getPocPhone() {
        return pocPhone;
    }

    public String getStatus() {
        return status;
    }

    public String getRequestedBy() {
        return requestedBy;
    }
}
