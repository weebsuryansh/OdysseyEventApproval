package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.DecisionRequest;
import org.example.odysseyeventapproval.dto.SubEventResponse;
import org.example.odysseyeventapproval.model.SubEvent;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.service.CurrentUserService;
import org.example.odysseyeventapproval.service.EventService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sub-events")
public class SubEventController {
    private final EventService eventService;
    private final CurrentUserService currentUserService;

    public SubEventController(EventService eventService, CurrentUserService currentUserService) {
        this.eventService = eventService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('SA_OFFICE','FACULTY_COORDINATOR','DEAN')")
    public SubEventResponse decide(@PathVariable Long id, @RequestBody DecisionRequest request) {
        User approver = currentUserService.requireCurrentUser();
        SubEvent updated = eventService.decideOnSubEvent(approver, id, request);
        return SubEventResponse.from(updated);
    }
}
