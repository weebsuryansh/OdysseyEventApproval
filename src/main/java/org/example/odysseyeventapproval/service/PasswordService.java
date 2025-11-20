package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.model.PasswordCredential;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.repository.PasswordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordService {
    private final CurrentUserService currentUserService;
    private final PasswordRepository passwordRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordService(CurrentUserService currentUserService,
                           PasswordRepository passwordRepository,
                           PasswordEncoder passwordEncoder) {
        this.currentUserService = currentUserService;
        this.passwordRepository = passwordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void changeOwnPassword(String currentPassword, String newPassword) {
        User user = currentUserService.requireCurrentUser();
        PasswordCredential credential = passwordRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Password missing"));
        if (!passwordEncoder.matches(currentPassword, credential.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        credential.setPasswordHash(passwordEncoder.encode(newPassword));
        passwordRepository.save(credential);
    }
}
