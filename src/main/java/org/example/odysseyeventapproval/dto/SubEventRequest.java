package org.example.odysseyeventapproval.dto;

import java.math.BigDecimal;
import java.util.List;

public class SubEventRequest {
    private String name;
    private BigDecimal budgetHead;
    private List<BudgetItemDto> budgetItems;
    private Long clubId;
    private String pocUsername;
    private String pocName;
    private String pocPhone;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getBudgetHead() {
        return budgetHead;
    }

    public void setBudgetHead(BigDecimal budgetHead) {
        this.budgetHead = budgetHead;
    }

    public String getPocUsername() {
        return pocUsername;
    }

    public void setPocUsername(String pocUsername) {
        this.pocUsername = pocUsername;
    }

    public String getPocName() {
        return pocName;
    }

    public void setPocName(String pocName) {
        this.pocName = pocName;
    }

    public String getPocPhone() {
        return pocPhone;
    }

    public void setPocPhone(String pocPhone) {
        this.pocPhone = pocPhone;
    }

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public void setBudgetItems(List<BudgetItemDto> budgetItems) {
        this.budgetItems = budgetItems;
    }

    public Long getClubId() {
        return clubId;
    }

    public void setClubId(Long clubId) {
        this.clubId = clubId;
    }
}
