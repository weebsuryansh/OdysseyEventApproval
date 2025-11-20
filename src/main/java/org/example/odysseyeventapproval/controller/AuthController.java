package org.example.odysseyeventapproval.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.example.odysseyeventapproval.dto.AuthRequest;
import org.example.odysseyeventapproval.dto.AuthResponse;
import org.example.odysseyeventapproval.dto.PasswordChangeRequest;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.example.odysseyeventapproval.service.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, PasswordService passwordService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request, HttpServletRequest servletRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = servletRequest.getSession(true);
        session.setMaxInactiveInterval(600);
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("User missing"));
        return new AuthResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole());
    }

    @GetMapping("/me")
    public AuthResponse me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(user -> new AuthResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole()))
                .orElse(null);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        request.getSession(false);
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody PasswordChangeRequest request) {
        passwordService.changeOwnPassword(request.getCurrentPassword(), request.getNewPassword());
    }
}
