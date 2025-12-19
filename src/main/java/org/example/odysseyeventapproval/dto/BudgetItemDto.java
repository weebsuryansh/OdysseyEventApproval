package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.BudgetItem;

import java.math.BigDecimal;

public class BudgetItemDto {
    private String description;
    private BigDecimal amount;

    public static BudgetItemDto from(BudgetItem item) {
        BudgetItemDto dto = new BudgetItemDto();
        dto.description = item.getDescription();
        dto.amount = item.getAmount();
        return dto;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
