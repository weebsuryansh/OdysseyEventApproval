package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Club> findByNameIgnoreCase(String name);
}
