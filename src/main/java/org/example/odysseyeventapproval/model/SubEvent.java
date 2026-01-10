package org.example.odysseyeventapproval.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity
@Table(name = "sub_events")
public class SubEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String budgetHead;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal budgetTotal = BigDecimal.ZERO;

    @Column(nullable = false, length = 2000)
    private String budgetBreakdown;

    @Column(nullable = false, length = 2000)
    private String inflowBreakdown = "[]";

    @Lob
    @Column(nullable = false)
    private String budgetPhotos = "[]";

    @Column(nullable = false, length = 8000)
    private String afterEventItemsJson = "[]";

    @Column(nullable = false, length = 8000)
    private String afterEventImagesJson = "[]";

    @Column(length = 16)
    private String afterEventBudgetStatus;

    @Column(precision = 14, scale = 2)
    private BigDecimal afterEventBudgetDelta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "poc_id")
    private User poc;

    @ManyToOne(optional = false)
    @JoinColumn(name = "club_id")
    private Club club;

    @Column(nullable = false)
    private String pocName;

    @Column(nullable = false)
    private String pocPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PocStatus pocStatus = PocStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus saStatus = DecisionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus facultyStatus = DecisionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus deanStatus = DecisionStatus.PENDING;

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

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

    public BigDecimal getBudgetTotal() {
        return budgetTotal;
    }

    public void setBudgetTotal(BigDecimal budgetTotal) {
        this.budgetTotal = budgetTotal;
    }

    public String getBudgetBreakdown() {
        return budgetBreakdown;
    }

    public void setBudgetBreakdown(String budgetBreakdown) {
        this.budgetBreakdown = budgetBreakdown;
    }

    public String getInflowBreakdown() {
        return inflowBreakdown;
    }

    public void setInflowBreakdown(String inflowBreakdown) {
        this.inflowBreakdown = inflowBreakdown;
    }

    public String getBudgetPhotos() {
        return budgetPhotos;
    }

    public void setBudgetPhotos(String budgetPhotos) {
        this.budgetPhotos = budgetPhotos;
    }

    public String getAfterEventItemsJson() {
        return afterEventItemsJson;
    }

    public void setAfterEventItemsJson(String afterEventItemsJson) {
        this.afterEventItemsJson = afterEventItemsJson;
    }

    public String getAfterEventImagesJson() {
        return afterEventImagesJson;
    }

    public void setAfterEventImagesJson(String afterEventImagesJson) {
        this.afterEventImagesJson = afterEventImagesJson;
    }

    public String getAfterEventBudgetStatus() {
        return afterEventBudgetStatus;
    }

    public void setAfterEventBudgetStatus(String afterEventBudgetStatus) {
        this.afterEventBudgetStatus = afterEventBudgetStatus;
    }

    public BigDecimal getAfterEventBudgetDelta() {
        return afterEventBudgetDelta;
    }

    public void setAfterEventBudgetDelta(BigDecimal afterEventBudgetDelta) {
        this.afterEventBudgetDelta = afterEventBudgetDelta;
    }

    public User getPoc() {
        return poc;
    }

    public void setPoc(User poc) {
        this.poc = poc;
    }

    public Club getClub() {
        return club;
    }

    public void setClub(Club club) {
        this.club = club;
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

    public PocStatus getPocStatus() {
        return pocStatus;
    }

    public void setPocStatus(PocStatus pocStatus) {
        this.pocStatus = pocStatus;
    }

    public DecisionStatus getSaStatus() {
        return saStatus;
    }

    public void setSaStatus(DecisionStatus saStatus) {
        this.saStatus = saStatus;
    }

    public DecisionStatus getFacultyStatus() {
        return facultyStatus;
    }

    public void setFacultyStatus(DecisionStatus facultyStatus) {
        this.facultyStatus = facultyStatus;
    }

    public DecisionStatus getDeanStatus() {
        return deanStatus;
    }

    public void setDeanStatus(DecisionStatus deanStatus) {
        this.deanStatus = deanStatus;
    }
}
