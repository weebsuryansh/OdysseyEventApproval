package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.dto.UserCreateRequest;
import org.example.odysseyeventapproval.dto.UserUpdateRequest;
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
        user.setUsername(normalizeValue(request.getUsername()));
        user.setDisplayName(normalizeValue(request.getDisplayName()));
        user.setEmail(resolveEmail(request));
        user.setRole(request.getRole());
        User saved = userRepository.save(user);
        PasswordCredential credential = new PasswordCredential();
        credential.setUser(saved);
        credential.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        passwordRepository.save(credential);
        return saved;
    }

    @Transactional
    public User updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id).orElseThrow();
        user.setUsername(normalizeValue(request.getUsername()));
        user.setDisplayName(normalizeValue(request.getDisplayName()));
        user.setEmail(normalizeNullable(request.getEmail()));
        user.setRole(request.getRole());
        return userRepository.save(user);
    }

    private String resolveEmail(UserCreateRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return request.getEmail().trim();
        }
        return normalizeNullable(request.getUsername());
    }

    private String normalizeValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Value is required");
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Value is required");
        }
        return trimmed;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
