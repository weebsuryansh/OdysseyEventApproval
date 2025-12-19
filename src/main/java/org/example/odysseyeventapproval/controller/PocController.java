package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.PocDecisionRequest;
import org.example.odysseyeventapproval.dto.PocRequestResponse;
import org.example.odysseyeventapproval.model.SubEvent;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.service.CurrentUserService;
import org.example.odysseyeventapproval.service.EventService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/poc")
public class PocController {
    private final EventService eventService;
    private final CurrentUserService currentUserService;

    public PocController(EventService eventService, CurrentUserService currentUserService) {
        this.eventService = eventService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PocRequestResponse> myPocRequests() {
        User poc = currentUserService.requireCurrentUser();
        List<SubEvent> subEvents = eventService.listPendingPoc(poc);
        return subEvents.stream().map(PocRequestResponse::from).collect(Collectors.toList());
    }

    @PostMapping("/requests/{id}/decision")
    @PreAuthorize("hasRole('STUDENT')")
    public PocRequestResponse decide(@PathVariable Long id, @RequestBody PocDecisionRequest request) {
        User poc = currentUserService.requireCurrentUser();
        SubEvent updated = eventService.decideOnPoc(poc, id, request);
        return PocRequestResponse.from(updated);
    }
}
