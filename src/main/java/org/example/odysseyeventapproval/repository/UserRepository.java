package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(UserRole role);
}
