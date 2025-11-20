package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.DecisionRequest;
import org.example.odysseyeventapproval.dto.EventRequest;
import org.example.odysseyeventapproval.dto.EventResponse;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.example.odysseyeventapproval.service.CurrentUserService;
import org.example.odysseyeventapproval.service.EventService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;
    private final CurrentUserService currentUserService;

    public EventController(EventService eventService, CurrentUserService currentUserService) {
        this.eventService = eventService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public EventResponse create(@RequestBody EventRequest request) {
        User student = currentUserService.requireCurrentUser();
        Event created = eventService.createEvent(student, request);
        return EventResponse.from(created);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<EventResponse> myEvents() {
        User student = currentUserService.requireCurrentUser();
        return eventService.listForStudent(student).stream().map(EventResponse::from).collect(Collectors.toList());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SA_OFFICE','FACULTY_COORDINATOR','DEAN')")
    public List<EventResponse> pendingForRole() {
        User approver = currentUserService.requireCurrentUser();
        return eventService.listPendingForRole(approver.getRole()).stream().map(EventResponse::from).collect(Collectors.toList());
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('SA_OFFICE','FACULTY_COORDINATOR','DEAN')")
    public EventResponse decide(@PathVariable Long id, @RequestBody DecisionRequest request) {
        User approver = currentUserService.requireCurrentUser();
        Event updated = eventService.decide(approver, id, request);
        return EventResponse.from(updated);
    }
}
