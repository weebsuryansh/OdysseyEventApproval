package org.example.odysseyeventapproval.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

public class AfterEventImageDto {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String url;
    private String description;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static List<AfterEventImageDto> parse(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static String toJson(List<AfterEventImageDto> items) {
        try {
            return MAPPER.writeValueAsString(items);
        } catch (Exception e) {
            return "[]";
        }
    }
}
