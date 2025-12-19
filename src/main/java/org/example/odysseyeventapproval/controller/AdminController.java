package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.EventResponse;
import org.example.odysseyeventapproval.dto.ClubRequest;
import org.example.odysseyeventapproval.dto.ClubResponse;
import org.example.odysseyeventapproval.dto.UserCreateRequest;
import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.example.odysseyeventapproval.service.EventService;
import org.example.odysseyeventapproval.service.ClubService;
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
    private final ClubService clubService;

    public AdminController(UserAdminService userAdminService, EventService eventService, UserRepository userRepository, ClubService clubService) {
        this.userAdminService = userAdminService;
        this.eventService = eventService;
        this.userRepository = userRepository;
        this.clubService = clubService;
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

    @GetMapping("/clubs")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public List<ClubResponse> allClubs() {
        return clubService.listAll().stream().map(ClubResponse::from).collect(Collectors.toList());
    }

    @PostMapping("/clubs")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public ClubResponse createClub(@RequestBody ClubRequest request) {
        return ClubResponse.from(clubService.create(request.getName()));
    }

    @PutMapping("/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public ClubResponse updateClub(@PathVariable Long id, @RequestBody ClubRequest request) {
        return ClubResponse.from(clubService.update(id, request.getName()));
    }

    @DeleteMapping("/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public void deleteClub(@PathVariable Long id) {
        clubService.delete(id);
    }
}
