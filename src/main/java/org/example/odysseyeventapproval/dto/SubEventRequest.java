package org.example.odysseyeventapproval.dto;

public class SubEventRequest {
    private String name;
    private String budgetHead;
    private String budgetBreakdown;
    private String pocUsername;
    private String pocName;
    private String pocPhone;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBudgetHead() {
        return budgetHead;
    }

    public void setBudgetHead(String budgetHead) {
        this.budgetHead = budgetHead;
    }

    public String getBudgetBreakdown() {
        return budgetBreakdown;
    }

    public void setBudgetBreakdown(String budgetBreakdown) {
        this.budgetBreakdown = budgetBreakdown;
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
}
