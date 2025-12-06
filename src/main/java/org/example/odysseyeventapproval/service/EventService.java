package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.dto.DecisionRequest;
import org.example.odysseyeventapproval.dto.EventRequest;
import org.example.odysseyeventapproval.model.*;
import org.example.odysseyeventapproval.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(User student, EventRequest request) {
        Event event = new Event();
        event.setStudent(student);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        return eventRepository.save(event);
    }

    public List<Event> listForStudent(User student) {
        return eventRepository.findByStudent(student);
    }

    public List<Event> listAll() {
        return eventRepository.findAll();
    }

    public List<Event> listPendingForRole(UserRole role) {
        return switch (role) {
            case SA_OFFICE -> eventRepository.findByStage(EventStage.SA_REVIEW);
            case FACULTY_COORDINATOR -> eventRepository.findByStage(EventStage.FACULTY_REVIEW);
            case DEAN -> eventRepository.findByStage(EventStage.DEAN_REVIEW);
            default -> List.of();
        };
    }

    @Transactional
    public Event decide(User approver, Long eventId, DecisionRequest request) {
        Event event = eventRepository.findById(eventId).orElseThrow();
        if (event.getStage() == EventStage.APPROVED || event.getStage() == EventStage.REJECTED) {
            return event;
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
