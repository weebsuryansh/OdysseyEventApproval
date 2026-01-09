package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.dto.UserCreateRequest;
import org.example.odysseyeventapproval.model.PasswordCredential;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.repository.PasswordRepository;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAdminService {
    private final UserRepository userRepository;
    private final PasswordRepository passwordRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(UserRepository userRepository, PasswordRepository passwordRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordRepository = passwordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(UserCreateRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setDisplayName(request.getDisplayName());
        user.setEmail(resolveEmail(request));
        user.setRole(request.getRole());
        User saved = userRepository.save(user);
        PasswordCredential credential = new PasswordCredential();
        credential.setUser(saved);
        credential.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        passwordRepository.save(credential);
        return saved;
    }

    private String resolveEmail(UserCreateRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return request.getEmail().trim();
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            return request.getUsername().trim();
        }
        return null;
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
