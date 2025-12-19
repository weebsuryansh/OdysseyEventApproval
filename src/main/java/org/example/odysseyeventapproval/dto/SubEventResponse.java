package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.SubEvent;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class SubEventResponse {
    private Long id;
    private String name;
    private BigDecimal budgetHead;
    private List<BudgetItemDto> budgetItems;
    private Long clubId;
    private String clubName;
    private String pocUsername;
    private String pocName;
    private String pocPhone;
    private String status;

    public static SubEventResponse from(SubEvent subEvent) {
        SubEventResponse response = new SubEventResponse();
        response.id = subEvent.getId();
        response.name = subEvent.getName();
        response.budgetHead = subEvent.getBudgetHead();
        response.budgetItems = subEvent.getBudgetItems().stream().map(BudgetItemDto::from).collect(Collectors.toList());
        response.clubId = subEvent.getClub().getId();
        response.clubName = subEvent.getClub().getName();
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

    public BigDecimal getBudgetHead() {
        return budgetHead;
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

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public Long getClubId() {
        return clubId;
    }

    public String getClubName() {
        return clubName;
    }
}
