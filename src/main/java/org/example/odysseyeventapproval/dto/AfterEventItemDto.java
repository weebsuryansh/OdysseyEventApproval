package org.example.odysseyeventapproval.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

public class AfterEventItemDto {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String description;
    private BigDecimal amount;
    private List<AfterEventInvoiceDto> invoices;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public List<AfterEventInvoiceDto> getInvoices() {
        return invoices;
    }

    public void setInvoices(List<AfterEventInvoiceDto> invoices) {
        this.invoices = invoices;
    }

    public static List<AfterEventItemDto> parse(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static String toJson(List<AfterEventItemDto> items) {
        try {
            return MAPPER.writeValueAsString(items);
        } catch (Exception e) {
            return "[]";
        }
    }
}
