package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.model.Club;
import org.example.odysseyeventapproval.repository.ClubRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClubService {
    private final ClubRepository clubRepository;

    public ClubService(ClubRepository clubRepository) {
        this.clubRepository = clubRepository;
    }

    public List<Club> listAll() {
        return clubRepository.findAll();
    }

    @Transactional
    public Club create(String name) {
        validateName(name);
        clubRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new IllegalArgumentException("Club already exists with name: " + name);
        });
        Club club = new Club();
        club.setName(name.trim());
        return clubRepository.save(club);
    }

    @Transactional
    public Club update(Long id, String name) {
        validateName(name);
        Club club = clubRepository.findById(id).orElseThrow();
        clubRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalArgumentException("Club already exists with name: " + name); });
        club.setName(name.trim());
        return clubRepository.save(club);
    }

    @Transactional
    public void delete(Long id) {
        clubRepository.deleteById(id);
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Club name cannot be empty");
        }
    }
}
