package org.example.odysseyeventapproval.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class BudgetPhotoDto {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static List<BudgetPhotoItem> parse(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            try {
                List<String> legacy = MAPPER.readValue(json, new TypeReference<>() {});
                return legacy.stream().map(url -> new BudgetPhotoItem(url, "")).collect(Collectors.toList());
            } catch (Exception legacyError) {
                return Collections.emptyList();
            }
        }
    }

    public static String toJson(List<BudgetPhotoItem> photos) {
        if (photos == null) {
            return "[]";
        }
        try {
            return MAPPER.writeValueAsString(photos);
        } catch (Exception e) {
            return "[]";
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BudgetPhotoItem {
        private String url;
        private String description;

        public BudgetPhotoItem() {}

        public BudgetPhotoItem(String url, String description) {
            this.url = url;
            this.description = description;
        }

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
    }
}
