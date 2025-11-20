package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.UserRole;

public class AuthResponse {
    private Long id;
    private String username;
    private String displayName;
    private UserRole role;

    public AuthResponse() {}

    public AuthResponse(Long id, String username, String displayName, UserRole role) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public UserRole getRole() {
        return role;
    }
}
