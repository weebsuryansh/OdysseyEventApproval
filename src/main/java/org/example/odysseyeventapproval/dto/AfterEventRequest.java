package org.example.odysseyeventapproval.dto;

import java.math.BigDecimal;
import java.util.List;

public class AfterEventRequest {
    private List<AfterEventItemDto> items;
    private List<AfterEventImageDto> images;
    private String budgetStatus;
    private BigDecimal budgetDelta;

    public List<AfterEventItemDto> getItems() {
        return items;
    }

    public void setItems(List<AfterEventItemDto> items) {
        this.items = items;
    }

    public List<AfterEventImageDto> getImages() {
        return images;
    }

    public void setImages(List<AfterEventImageDto> images) {
        this.images = images;
    }

    public String getBudgetStatus() {
        return budgetStatus;
    }

    public void setBudgetStatus(String budgetStatus) {
        this.budgetStatus = budgetStatus;
    }

    public BigDecimal getBudgetDelta() {
        return budgetDelta;
    }

    public void setBudgetDelta(BigDecimal budgetDelta) {
        this.budgetDelta = budgetDelta;
    }
}
