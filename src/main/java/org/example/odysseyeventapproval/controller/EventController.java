package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.DecisionRequest;
import org.example.odysseyeventapproval.dto.EventRequest;
import org.example.odysseyeventapproval.dto.EventResponse;
import org.example.odysseyeventapproval.dto.SubEventRequest;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.EventStage;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.service.BudgetReportService;
import org.example.odysseyeventapproval.service.CurrentUserService;
import org.example.odysseyeventapproval.service.EventService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;
    private final CurrentUserService currentUserService;
    private final BudgetReportService budgetReportService;

    public EventController(EventService eventService, CurrentUserService currentUserService, BudgetReportService budgetReportService) {
        this.eventService = eventService;
        this.currentUserService = currentUserService;
        this.budgetReportService = budgetReportService;
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

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SA_OFFICE','FACULTY_COORDINATOR','DEAN')")
    public List<EventResponse> historyForRole(@RequestParam(defaultValue = "DESC") String sort) {
        User approver = currentUserService.requireCurrentUser();
        Sort.Direction direction = Sort.Direction.fromOptionalString(sort).orElse(Sort.Direction.DESC);
        Sort ordered = Sort.by(direction, "updatedAt");
        return eventService.listHistoryForRole(approver.getRole(), ordered).stream().map(EventResponse::from).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','SA_OFFICE','FACULTY_COORDINATOR','DEAN','ADMIN','DEV')")
    public EventResponse viewEvent(@PathVariable Long id) {
        User viewer = currentUserService.requireCurrentUser();
        Event event = eventService.requireEventForViewer(viewer, id);
        return EventResponse.from(event);
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('SA_OFFICE','FACULTY_COORDINATOR','DEAN')")
    public EventResponse decide(@PathVariable Long id, @RequestBody DecisionRequest request) {
        User approver = currentUserService.requireCurrentUser();
        Event updated = eventService.decide(approver, id, request);
        return EventResponse.from(updated);
    }

    @PostMapping("/{id}/sub-events")
    @PreAuthorize("hasRole('STUDENT')")
    public EventResponse addSubEvent(@PathVariable Long id, @RequestBody SubEventRequest request) {
        User student = currentUserService.requireCurrentUser();
        Event updated = eventService.addSubEvent(student, id, request);
        return EventResponse.from(updated);
    }

    @DeleteMapping("/{id}/sub-events/{subEventId}")
    @PreAuthorize("hasRole('STUDENT')")
    public EventResponse removeSubEvent(@PathVariable Long id, @PathVariable Long subEventId) {
        User student = currentUserService.requireCurrentUser();
        Event updated = eventService.removeSubEvent(student, id, subEventId);
        return EventResponse.from(updated);
    }

    @GetMapping(value = "/{id}/pre-event.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','SA_OFFICE','FACULTY_COORDINATOR','DEAN','ADMIN','DEV')")
    public ResponseEntity<byte[]> downloadPreEventReport(@PathVariable Long id) {
        User approver = currentUserService.requireCurrentUser();
        Event event = eventService.requireEventForViewer(approver, id);
        byte[] pdf = budgetReportService.generatePreEventReport(event);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + id + "-pre-event.pdf")
                .body(pdf);
    }

    @GetMapping(value = "/{id}/inflow-outflow.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','SA_OFFICE','FACULTY_COORDINATOR','DEAN','ADMIN','DEV')")
    public ResponseEntity<byte[]> downloadInflowOutflowReport(@PathVariable Long id) {
        User approver = currentUserService.requireCurrentUser();
        Event event = eventService.requireEventForViewer(approver, id);
        byte[] pdf = budgetReportService.generateInflowOutflowReport(event);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + id + "-inflow-outflow.pdf")
                .body(pdf);
    }

    @GetMapping(value = "/{id}/post-event.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','SA_OFFICE','FACULTY_COORDINATOR','DEAN','ADMIN','DEV')")
    public ResponseEntity<byte[]> downloadPostEventReport(@PathVariable Long id) {
        User viewer = currentUserService.requireCurrentUser();
        Event event = eventService.requireEventForViewer(viewer, id);
        if (event.getStage() != EventStage.APPROVED) {
            throw new IllegalStateException("Post-event report is available after approval");
        }
        byte[] pdf = budgetReportService.generatePostEventReport(event);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + id + "-post-event.pdf")
                .body(pdf);
    }

    @GetMapping(value = "/{id}/budget.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','SA_OFFICE','FACULTY_COORDINATOR','DEAN','ADMIN','DEV')")
    public ResponseEntity<byte[]> downloadLegacyBudgetReport(@PathVariable Long id) {
        return downloadPreEventReport(id);
    }
}
