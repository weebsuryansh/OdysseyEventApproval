package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.dto.ClubRequest;
import org.example.odysseyeventapproval.dto.ClubResponse;
import org.example.odysseyeventapproval.service.ClubService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ClubController {
    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    @GetMapping("/clubs")
    @PreAuthorize("isAuthenticated()")
    public List<ClubResponse> listClubs() {
        return clubService.listAll();
    }

    @PostMapping("/admin/clubs")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public ClubResponse create(@RequestBody ClubRequest request) {
        return clubService.create(request);
    }

    @PutMapping("/admin/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public ClubResponse update(@PathVariable Long id, @RequestBody ClubRequest request) {
        return clubService.update(id, request);
    }

    @DeleteMapping("/admin/clubs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DEV')")
    public void delete(@PathVariable Long id) {
        clubService.delete(id);
    }
}
