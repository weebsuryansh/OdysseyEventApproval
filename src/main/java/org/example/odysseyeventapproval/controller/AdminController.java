package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.EventResponse;
import org.example.odysseyeventapproval.dto.UserCreateRequest;
import org.example.odysseyeventapproval.dto.UserUpdateRequest;
import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.example.odysseyeventapproval.service.EventService;
import org.example.odysseyeventapproval.service.UserAdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserAdminService userAdminService;
    private final EventService eventService;
    private final UserRepository userRepository;

    public AdminController(UserAdminService userAdminService, EventService eventService, UserRepository userRepository) {
        this.userAdminService = userAdminService;
        this.eventService = eventService;
        this.userRepository = userRepository;
    }

    @PostMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public User createUser(@RequestBody UserCreateRequest request) {
        return userAdminService.createUser(request);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public void deleteUser(@PathVariable Long id) {
        userAdminService.deleteUser(id);
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public User updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        return userAdminService.updateUser(id, request);
    }

    @PostMapping("/events/{id}/override")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public EventResponse override(
            @PathVariable Long id,
            @RequestParam String target,
            @RequestParam DecisionStatus status,
            @RequestParam(required = false) String remark
    ) {
        return EventResponse.from(eventService.overrideDecision(id, target, status, remark));
    }

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public List<EventResponse> allEvents() {
        return eventService.listAll().stream().map(EventResponse::from).collect(Collectors.toList());
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public Iterable<User> allUsers() {
        return userRepository.findAll();
    }
}
