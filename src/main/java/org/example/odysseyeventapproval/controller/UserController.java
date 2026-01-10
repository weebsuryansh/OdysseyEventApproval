package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.UserSearchResponse;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.example.odysseyeventapproval.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserController(UserRepository userRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('STUDENT')")
    public List<UserSearchResponse> search(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        User currentUser = currentUserService.requireCurrentUser();
        return userRepository.findByRoleAndUsernameContainingIgnoreCase(UserRole.STUDENT, query.trim()).stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .limit(12)
                .map(UserSearchResponse::from)
                .collect(Collectors.toList());
    }
}
