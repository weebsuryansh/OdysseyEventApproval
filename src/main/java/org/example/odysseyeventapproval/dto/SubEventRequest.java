package org.example.odysseyeventapproval.dto;

import java.util.List;

public class SubEventRequest {
    private String name;
    private String budgetHead;
    private List<BudgetItemDto> budgetItems;
    private List<BudgetPhotoDto.BudgetPhotoItem> budgetPhotos;
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

    public List<BudgetPhotoDto.BudgetPhotoItem> getBudgetPhotos() {
        return budgetPhotos;
    }

    public void setBudgetPhotos(List<BudgetPhotoDto.BudgetPhotoItem> budgetPhotos) {
        this.budgetPhotos = budgetPhotos;
    }

    public Long getClubId() {
        return clubId;
    }

    public void setClubId(Long clubId) {
        this.clubId = clubId;
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
