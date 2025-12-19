package org.example.odysseyeventapproval.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetHead;

    @OneToMany(mappedBy = "subEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<BudgetItem> budgetItems = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(name = "club_id")
    private Club club;

    @ManyToOne(optional = false)
    @JoinColumn(name = "poc_id")
    private User poc;

    @Column(nullable = false)
    private String pocName;

    @Column(nullable = false)
    private String pocPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PocStatus pocStatus = PocStatus.PENDING;

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

    public BigDecimal getBudgetHead() {
        return budgetHead;
    }

    public void setBudgetHead(BigDecimal budgetHead) {
        this.budgetHead = budgetHead;
    }

    public User getPoc() {
        return poc;
    }

    public void setPoc(User poc) {
        this.poc = poc;
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

    public List<BudgetItem> getBudgetItems() {
        return budgetItems;
    }

    public void setBudgetItems(List<BudgetItem> budgetItems) {
        this.budgetItems = budgetItems;
    }

    public Club getClub() {
        return club;
    }

    public void setClub(Club club) {
        this.club = club;
    }
}
