package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.ClubResponse;
import org.example.odysseyeventapproval.service.ClubService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {
    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ClubResponse> list() {
        return clubService.listAll().stream().map(ClubResponse::from).collect(Collectors.toList());
    }
}
