package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.SubEvent;

public class SubEventResponse {
    private Long id;
    private String name;
    private String budgetHead;
    private String budgetBreakdown;
    private String pocUsername;
    private String pocName;
    private String pocPhone;
    private String status;

    public static SubEventResponse from(SubEvent subEvent) {
        SubEventResponse response = new SubEventResponse();
        response.id = subEvent.getId();
        response.name = subEvent.getName();
        response.budgetHead = subEvent.getBudgetHead();
        response.budgetBreakdown = subEvent.getBudgetBreakdown();
        response.pocUsername = subEvent.getPoc().getUsername();
        response.pocName = subEvent.getPocName();
        response.pocPhone = subEvent.getPocPhone();
        response.status = subEvent.getPocStatus().name();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBudgetHead() {
        return budgetHead;
    }

    public String getBudgetBreakdown() {
        return budgetBreakdown;
    }

    public String getPocUsername() {
        return pocUsername;
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
}
