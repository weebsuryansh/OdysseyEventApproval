package org.example.odysseyeventapproval.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

public class BudgetPhotoDto {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static List<String> parse(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static String toJson(List<String> photos) {
        if (photos == null) {
            return "[]";
        }
        try {
            return MAPPER.writeValueAsString(photos);
        } catch (Exception e) {
            return "[]";
        }
    }
}
