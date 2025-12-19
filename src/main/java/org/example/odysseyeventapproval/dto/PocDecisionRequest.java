package org.example.odysseyeventapproval.dto;

import java.math.BigDecimal;
import java.util.List;

public class PocDecisionRequest {
    private boolean accept;
    private BigDecimal budgetHead;
    private List<BudgetItemDto> budgetItems;

    public boolean isAccept() {
        return accept;
    }

    public void setAccept(boolean accept) {
        this.accept = accept;
    }

    public BigDecimal getBudgetHead() {
        return budgetHead;
    }

    public void setBudgetHead(BigDecimal budgetHead) {
        this.budgetHead = budgetHead;
    }

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public void setBudgetItems(List<BudgetItemDto> budgetItems) {
        this.budgetItems = budgetItems;
    }
}
