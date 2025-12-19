package org.example.odysseyeventapproval.dto;

import org.example.odysseyeventapproval.model.Club;

public class ClubResponse {
    private Long id;
    private String name;

    public static ClubResponse from(Club club) {
        ClubResponse response = new ClubResponse();
        response.id = club.getId();
        response.name = club.getName();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
