package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.SubEvent;

import java.math.BigDecimal;
import java.util.List;

public class PocRequestResponse {
    private Long subEventId;
    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private String subEventName;
    private BigDecimal budgetHead;
    private List<BudgetItemDto> budgetItems;
    private String clubName;
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
        response.budgetItems = BudgetItemDto.parse(subEvent.getBudgetBreakdown());
        response.clubName = subEvent.getClub().getName();
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

    public BigDecimal getBudgetHead() {
        return budgetHead;
    }

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public String getClubName() {
        return clubName;
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
