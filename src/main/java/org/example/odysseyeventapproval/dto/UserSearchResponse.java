package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.User;

public class UserSearchResponse {
    private String username;
    private String displayName;

    public static UserSearchResponse from(User user) {
        UserSearchResponse response = new UserSearchResponse();
        response.username = user.getUsername();
        response.displayName = user.getDisplayName();
        return response;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }
}
