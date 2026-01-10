package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.SubEvent;

import java.util.List;

public class SubEventResponse {
    private Long id;
    private String name;
    private String budgetHead;
    private java.math.BigDecimal budgetTotal;
    private List<BudgetItemDto> budgetItems;
    private List<BudgetItemDto> inflowItems;
    private List<BudgetPhotoDto.BudgetPhotoItem> budgetPhotos;
    private List<AfterEventItemDto> afterEventItems;
    private List<AfterEventImageDto> afterEventImages;
    private String afterEventBudgetStatus;
    private java.math.BigDecimal afterEventBudgetDelta;
    private Long clubId;
    private String clubName;
    private String pocUsername;
    private String pocName;
    private String pocPhone;
    private String status;
    private String saStatus;
    private String facultyStatus;
    private String deanStatus;

    public static SubEventResponse from(SubEvent subEvent) {
        SubEventResponse response = new SubEventResponse();
        response.id = subEvent.getId();
        response.name = subEvent.getName();
        response.budgetHead = subEvent.getBudgetHead();
        response.budgetTotal = subEvent.getBudgetTotal();
        response.budgetItems = BudgetItemDto.parse(subEvent.getBudgetBreakdown());
        response.inflowItems = BudgetItemDto.parse(subEvent.getInflowBreakdown());
        response.budgetPhotos = BudgetPhotoDto.parse(subEvent.getBudgetPhotos());
        response.afterEventItems = AfterEventItemDto.parse(subEvent.getAfterEventItemsJson());
        response.afterEventImages = AfterEventImageDto.parse(subEvent.getAfterEventImagesJson());
        response.afterEventBudgetStatus = subEvent.getAfterEventBudgetStatus();
        response.afterEventBudgetDelta = subEvent.getAfterEventBudgetDelta();
        response.clubId = subEvent.getClub().getId();
        response.clubName = subEvent.getClub().getName();
        response.pocUsername = subEvent.getPoc().getUsername();
        response.pocName = subEvent.getPocName();
        response.pocPhone = subEvent.getPocPhone();
        response.status = subEvent.getPocStatus().name();
        response.saStatus = subEvent.getSaStatus().name();
        response.facultyStatus = subEvent.getFacultyStatus().name();
        response.deanStatus = subEvent.getDeanStatus().name();
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

    public java.math.BigDecimal getBudgetTotal() {
        return budgetTotal;
    }

    public List<BudgetItemDto> getBudgetItems() {
        return budgetItems;
    }

    public List<BudgetItemDto> getInflowItems() {
        return inflowItems;
    }

    public List<BudgetPhotoDto.BudgetPhotoItem> getBudgetPhotos() {
        return budgetPhotos;
    }

    public List<AfterEventItemDto> getAfterEventItems() {
        return afterEventItems;
    }

    public List<AfterEventImageDto> getAfterEventImages() {
        return afterEventImages;
    }

    public String getAfterEventBudgetStatus() {
        return afterEventBudgetStatus;
    }

    public java.math.BigDecimal getAfterEventBudgetDelta() {
        return afterEventBudgetDelta;
    }

    public Long getClubId() {
        return clubId;
    }

    public String getClubName() {
        return clubName;
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

    public String getSaStatus() {
        return saStatus;
    }

    public String getFacultyStatus() {
        return facultyStatus;
    }

    public String getDeanStatus() {
        return deanStatus;
    }
}
