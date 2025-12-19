package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.dto.*;
import org.example.odysseyeventapproval.model.*;
import org.example.odysseyeventapproval.repository.EventRepository;
import org.example.odysseyeventapproval.repository.ClubRepository;
import org.example.odysseyeventapproval.repository.SubEventRepository;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.math.RoundingMode;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final SubEventRepository subEventRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;

    public EventService(
            EventRepository eventRepository,
            SubEventRepository subEventRepository,
            ClubRepository clubRepository,
            UserRepository userRepository
    ) {
        this.eventRepository = eventRepository;
        this.subEventRepository = subEventRepository;
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
    }

    public Event createEvent(User student, EventRequest request) {
        Event event = new Event();
        event.setStudent(student);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setSubEvents(buildSubEvents(event, student, request.getSubEvents()));
        return eventRepository.save(event);
    }

    public List<Event> listForStudent(User student) {
        return eventRepository.findByStudentOrderByCreatedAtDesc(student);
    }

    public List<Event> listAll() {
        return eventRepository.findAll();
    }

    public List<Event> listPendingForRole(UserRole role) {
        return switch (role) {
            case SA_OFFICE -> eventRepository.findByStageOrderByCreatedAtDesc(EventStage.SA_REVIEW);
            case FACULTY_COORDINATOR -> eventRepository.findByStageOrderByCreatedAtDesc(EventStage.FACULTY_REVIEW);
            case DEAN -> eventRepository.findByStageOrderByCreatedAtDesc(EventStage.DEAN_REVIEW);
            default -> List.of();
        };
    }

    public List<Event> listHistoryForRole(UserRole role, Sort sort) {
        return switch (role) {
            case SA_OFFICE -> eventRepository.findBySaStatusNot(DecisionStatus.PENDING, sort);
            case FACULTY_COORDINATOR -> eventRepository.findByFacultyStatusNot(DecisionStatus.PENDING, sort);
            case DEAN -> eventRepository.findByDeanStatusNot(DecisionStatus.PENDING, sort);
            default -> List.of();
        };
    }

    public Event requireEventForApprover(User approver, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        if (!isStageForRole(approver.getRole(), event.getStage())) {
            throw new IllegalArgumentException("User cannot view this event at its current stage");
        }
        return event;
    }

    public Event requireEventForViewer(User user, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.DEV) {
            return event;
        }

        if (user.getRole() == UserRole.STUDENT && event.getStudent().getId().equals(user.getId())) {
            return event;
        }

        boolean isPocForEvent = event.getSubEvents().stream()
                .anyMatch(sub -> sub.getPoc().getId().equals(user.getId()));
        if (isPocForEvent) {
            return event;
        }

        if (user.getRole() == UserRole.SA_OFFICE && (event.getSaStatus() != DecisionStatus.PENDING
                || event.getStage().ordinal() >= EventStage.SA_REVIEW.ordinal())) {
            return event;
        }

        if (user.getRole() == UserRole.FACULTY_COORDINATOR && (event.getFacultyStatus() != DecisionStatus.PENDING
                || event.getStage().ordinal() >= EventStage.FACULTY_REVIEW.ordinal())) {
            return event;
        }

        if (user.getRole() == UserRole.DEAN && (event.getDeanStatus() != DecisionStatus.PENDING
                || event.getStage().ordinal() >= EventStage.DEAN_REVIEW.ordinal())) {
            return event;
        }

        throw new IllegalStateException("User cannot view this event");
    }

    @Transactional
    public Event decide(User approver, Long eventId, DecisionRequest request) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        if (event.getStage() == EventStage.APPROVED || event.getStage() == EventStage.REJECTED) {
            return event;
        }
        if (event.getStage() == EventStage.POC_REVIEW) {
            throw new IllegalStateException("All POCs must respond before approvals can proceed");
        }
        if (approver.getRole() == UserRole.SA_OFFICE && event.getStage() == EventStage.SA_REVIEW) {
            applyDecision(event, request, StageTarget.SA);
        } else if (approver.getRole() == UserRole.FACULTY_COORDINATOR && event.getStage() == EventStage.FACULTY_REVIEW) {
            applyDecision(event, request, StageTarget.FACULTY);
        } else if (approver.getRole() == UserRole.DEAN && event.getStage() == EventStage.DEAN_REVIEW) {
            applyDecision(event, request, StageTarget.DEAN);
        } else {
            throw new IllegalStateException("User cannot decide on this stage");
        }
        return eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public List<SubEvent> listPendingPoc(User poc) {
        return subEventRepository.findByPocAndPocStatus(poc, PocStatus.PENDING);
    }

    @Transactional
    public SubEvent decideOnPoc(User poc, Long subEventId, PocDecisionRequest request) {
        SubEvent subEvent = subEventRepository.findById(subEventId).orElseThrow();
        if (!subEvent.getPoc().getId().equals(poc.getId())) {
            throw new IllegalStateException("User cannot act on this sub-event");
        }
        if (subEvent.getPocStatus() != PocStatus.PENDING) {
            return subEvent;
        }

        if (request.isAccept()) {
            List<BudgetItemDto> items = request.getBudgetItems();
            BigDecimal budgetHead = request.getBudgetHead();
            if (items == null || items.isEmpty()) {
                items = BudgetItemDto.parse(subEvent.getBudgetBreakdown());
            }
            if (budgetHead == null) {
                budgetHead = subEvent.getBudgetHead();
            }
            applyBudgetDetails(subEvent, budgetHead, items);
        }

        subEvent.setPocStatus(request.isAccept() ? PocStatus.ACCEPTED : PocStatus.DECLINED);
        Event event = subEvent.getEvent();

        if (!request.isAccept()) {
            event.setStage(EventStage.REJECTED);
            event.setSaStatus(DecisionStatus.REJECTED);
            event.setSaRemark("Rejected because POC declined");
        } else if (event.getSubEvents().stream().allMatch(se -> se.getPocStatus() == PocStatus.ACCEPTED)) {
            event.setStage(EventStage.SA_REVIEW);
        }

        event.touchUpdatedAt();
        eventRepository.save(event);
        return subEvent;
    }

    @Transactional
    public Event overrideDecision(Long eventId, String targetStage, DecisionStatus status, String remark) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        StageTarget target = StageTarget.from(targetStage);

        if (status == DecisionStatus.REJECTED && (remark == null || remark.isBlank())) {
            throw new IllegalArgumentException("Rejections require a remark");
        }

        switch (target) {
            case SA -> {
                event.setSaStatus(status);
                event.setSaRemark(remark);
            }
            case FACULTY -> {
                event.setFacultyStatus(status);
                event.setFacultyRemark(remark);
            }
            case DEAN -> {
                event.setDeanStatus(status);
                event.setDeanRemark(remark);
            }
        }

        updateStageFromDecisions(event);
        event.touchUpdatedAt();
        return eventRepository.save(event);
    }

    private void applyDecision(Event event, DecisionRequest request, StageTarget target) {
        DecisionStatus decisionStatus = request.isApprove() ? DecisionStatus.APPROVED : DecisionStatus.REJECTED;
        if (decisionStatus == DecisionStatus.REJECTED && (request.getRemark() == null || request.getRemark().isBlank())) {
            throw new IllegalArgumentException("Rejections require a remark");
        }
        switch (target) {
            case SA -> {
                event.setSaStatus(decisionStatus);
                event.setSaRemark(request.getRemark());
                if (decisionStatus == DecisionStatus.APPROVED) {
                    event.setStage(EventStage.FACULTY_REVIEW);
                } else {
                    event.setStage(EventStage.REJECTED);
                }
            }
            case FACULTY -> {
                event.setFacultyStatus(decisionStatus);
                event.setFacultyRemark(request.getRemark());
                if (decisionStatus == DecisionStatus.APPROVED) {
                    event.setStage(EventStage.DEAN_REVIEW);
                } else {
                    event.setStage(EventStage.REJECTED);
                }
            }
            case DEAN -> {
                event.setDeanStatus(decisionStatus);
                event.setDeanRemark(request.getRemark());
                if (decisionStatus == DecisionStatus.APPROVED) {
                    event.setStage(EventStage.APPROVED);
                } else {
                    event.setStage(EventStage.REJECTED);
                }
            }
        }
        event.touchUpdatedAt();
    }

    private List<SubEvent> buildSubEvents(Event event, User student, List<SubEventRequest> subEventRequests) {
        if (subEventRequests == null || subEventRequests.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one sub-event");
        }
        if (subEventRequests.size() > 15) {
            throw new IllegalArgumentException("A maximum of 15 sub-events is allowed");
        }

        List<SubEvent> results = new ArrayList<>();
        for (SubEventRequest request : subEventRequests) {
            User poc = userRepository.findByUsername(request.getPocUsername())
                    .orElseThrow(() -> new IllegalArgumentException("POC username not found: " + request.getPocUsername()));
            if (poc.getRole() != UserRole.STUDENT) {
                throw new IllegalArgumentException("POC must be a student user");
            }
            if (poc.getId().equals(student.getId())) {
                throw new IllegalArgumentException("POC cannot be the event creator");
            }

            SubEvent subEvent = new SubEvent();
            subEvent.setEvent(event);
            subEvent.setName(request.getName());
            subEvent.setClub(clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new IllegalArgumentException("Club not found")));
            applyBudgetDetails(subEvent, request.getBudgetHead(), request.getBudgetItems());
            subEvent.setPoc(poc);
            subEvent.setPocName(request.getPocName());
            subEvent.setPocPhone(request.getPocPhone());
            results.add(subEvent);
        }

        return results;
    }

    private void updateStageFromDecisions(Event event) {
        if (event.getSaStatus() != DecisionStatus.APPROVED) {
            event.setStage(event.getSaStatus() == DecisionStatus.REJECTED ? EventStage.REJECTED : EventStage.SA_REVIEW);
            return;
        }

        if (event.getFacultyStatus() != DecisionStatus.APPROVED) {
            event.setStage(event.getFacultyStatus() == DecisionStatus.REJECTED ? EventStage.REJECTED : EventStage.FACULTY_REVIEW);
            return;
        }

        if (event.getDeanStatus() != DecisionStatus.APPROVED) {
            event.setStage(event.getDeanStatus() == DecisionStatus.REJECTED ? EventStage.REJECTED : EventStage.DEAN_REVIEW);
            return;
        }

        event.setStage(EventStage.APPROVED);
    }

    private boolean isStageForRole(UserRole role, EventStage stage) {
        return switch (role) {
            case SA_OFFICE -> stage == EventStage.SA_REVIEW;
            case FACULTY_COORDINATOR -> stage == EventStage.FACULTY_REVIEW;
            case DEAN -> stage == EventStage.DEAN_REVIEW;
            default -> false;
        };
    }

    private void applyBudgetDetails(SubEvent subEvent, BigDecimal budgetHead, List<BudgetItemDto> budgetItems) {
        if (budgetHead == null || budgetHead.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Budget head must be greater than zero");
        }
        if (budgetItems == null || budgetItems.isEmpty()) {
            throw new IllegalArgumentException("Please add at least one budget line item");
        }

        BigDecimal normalizedHead = normalizeAmount(budgetHead);
        BigDecimal total = BigDecimal.ZERO;
        for (BudgetItemDto item : budgetItems) {
            if (item.getDescription() == null || item.getDescription().isBlank()) {
                throw new IllegalArgumentException("Each budget line needs a description");
            }
            if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Budget line amounts must be positive");
            }
            total = total.add(normalizeAmount(item.getAmount()));
        }

        if (total.compareTo(normalizedHead) != 0) {
            throw new IllegalArgumentException("Budget breakdown must add up to the budget head total");
        }

        subEvent.setBudgetHead(normalizedHead);
        subEvent.setBudgetBreakdown(BudgetItemDto.toJson(budgetItems));
    }

    private BigDecimal normalizeAmount(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private enum StageTarget {
        SA,
        FACULTY,
        DEAN;

        static StageTarget from(String value) {
            try {
                return StageTarget.valueOf(value.toUpperCase());
            } catch (Exception e) {
                throw new IllegalArgumentException("Unknown stage target: " + value);
            }
        }
    }
}
