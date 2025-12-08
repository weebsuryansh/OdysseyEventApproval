package org.example.odysseyeventapproval.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStage stage = EventStage.POC_REVIEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus saStatus = DecisionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus facultyStatus = DecisionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionStatus deanStatus = DecisionStatus.PENDING;

    private String saRemark;
    private String facultyRemark;
    private String deanRemark;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SubEvent> subEvents = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public EventStage getStage() {
        return stage;
    }

    public void setStage(EventStage stage) {
        this.stage = stage;
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

    public String getSaRemark() {
        return saRemark;
    }

    public void setSaRemark(String saRemark) {
        this.saRemark = saRemark;
    }

    public String getFacultyRemark() {
        return facultyRemark;
    }

    public void setFacultyRemark(String facultyRemark) {
        this.facultyRemark = facultyRemark;
    }

    public String getDeanRemark() {
        return deanRemark;
    }

    public void setDeanRemark(String deanRemark) {
        this.deanRemark = deanRemark;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touchUpdatedAt() {
        this.updatedAt = Instant.now();
    }

    public List<SubEvent> getSubEvents() {
        return subEvents;
    }

    public void setSubEvents(List<SubEvent> subEvents) {
        this.subEvents = subEvents;
    }
}
