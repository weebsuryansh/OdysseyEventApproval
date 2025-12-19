package org.example.odysseyeventapproval.dto;

import java.util.List;

public class PocDecisionRequest {
    private boolean accept;
    private String budgetHead;
    private List<BudgetItemDto> budgetItems;

    public boolean isAccept() {
        return accept;
    }

    public void setAccept(boolean accept) {
        this.accept = accept;
    }

    public String getBudgetHead() {
        return budgetHead;
    }

    public void setBudgetHead(String budgetHead) {
        this.budgetHead = budgetHead;
    }

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public void setBudgetItems(List<BudgetItemDto> budgetItems) {
        this.budgetItems = budgetItems;
    }
}
