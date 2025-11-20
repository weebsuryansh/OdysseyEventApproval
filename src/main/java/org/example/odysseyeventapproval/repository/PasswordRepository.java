package org.example.odysseyeventapproval.repository;

import org.example.odysseyeventapproval.model.PasswordCredential;
import org.example.odysseyeventapproval.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordRepository extends JpaRepository<PasswordCredential, Long> {
    Optional<PasswordCredential> findByUser(User user);
}
