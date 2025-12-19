package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.dto.ClubRequest;
import org.example.odysseyeventapproval.dto.ClubResponse;
import org.example.odysseyeventapproval.model.Club;
import org.example.odysseyeventapproval.repository.ClubRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClubService {
    private final ClubRepository clubRepository;

    public ClubService(ClubRepository clubRepository) {
        this.clubRepository = clubRepository;
    }

    @Transactional(readOnly = true)
    public List<ClubResponse> listAll() {
        return clubRepository.findAll().stream().map(ClubResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public ClubResponse create(ClubRequest request) {
        validateName(request.getName());
        if (clubRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("A club with this name already exists");
        }
        Club club = new Club();
        club.setName(request.getName().trim());
        return ClubResponse.from(clubRepository.save(club));
    }

    @Transactional
    public ClubResponse update(Long id, ClubRequest request) {
        validateName(request.getName());
        Club club = clubRepository.findById(id).orElseThrow();
        clubRepository.findByNameIgnoreCase(request.getName().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalArgumentException("A club with this name already exists"); });
        club.setName(request.getName().trim());
        return ClubResponse.from(clubRepository.save(club));
    }

    @Transactional
    public void delete(Long id) {
        clubRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Club requireClub(Long id) {
        return clubRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Club not found"));
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Club name cannot be empty");
        }
    }
}
