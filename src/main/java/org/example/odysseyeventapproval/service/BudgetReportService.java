package org.example.odysseyeventapproval.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.example.odysseyeventapproval.dto.BudgetItemDto;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.SubEvent;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class BudgetReportService {
    private static final float MARGIN = 40f;
    private static final float LINE_HEIGHT = 16f;

    public byte[] generateEventBudgetReport(Event event) {
        try (PDDocument document = new PDDocument()) {
            PageState state = newPage(document);

            writeTitle(state, "Event Budget Summary");
            writeText(state, String.format("Event: %s", event.getTitle()), PDType1Font.HELVETICA_BOLD);
            writeWrappedText(state, String.format("Description: %s", event.getDescription()));
            writeText(state, String.format("Student Owner: %s", event.getStudent().getDisplayName()));
            writeText(state, " ");

            writeTableHeader(state);
            for (SubEvent subEvent : event.getSubEvents()) {
                writeSubEvent(state, subEvent);
            }

            state.stream.close();

            try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                document.save(output);
                return output.toByteArray();
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to generate budget report", ex);
        }
    }

    private void writeTableHeader(PageState state) throws IOException {
        writeText(state, String.format("%-28s %-18s %-14s %-12s", "Sub-Event", "POC", "Phone", "Budget Head"), PDType1Font.COURIER_BOLD);
        writeText(state, String.format("%-28s %-18s %-14s %-12s", repeat('-', 10), repeat('-', 10), repeat('-', 10), repeat('-', 10)), PDType1Font.COURIER);
    }

    private void writeSubEvent(PageState state, SubEvent subEvent) throws IOException {
        String header = String.format(
                "%-28s %-18s %-14s %-12s",
                truncate(subEvent.getName(), 28),
                truncate(subEvent.getPocName(), 18),
                truncate(subEvent.getPocPhone(), 14),
                formatAmount(subEvent.getBudgetHead())
        );
        writeText(state, header, PDType1Font.COURIER);

        List<BudgetItemDto> items = BudgetItemDto.parse(subEvent.getBudgetBreakdown());
        if (items.isEmpty()) {
            writeText(state, "   - No budget items provided", PDType1Font.COURIER);
        } else {
            BigDecimal total = BigDecimal.ZERO;
            for (BudgetItemDto item : items) {
                total = total.add(item.getAmount() == null ? BigDecimal.ZERO : item.getAmount());
                String line = String.format("   - %-50s %10s",
                        truncate(item.getDescription(), 50),
                        formatAmount(item.getAmount()));
                writeText(state, line, PDType1Font.COURIER);
            }
            writeText(state, String.format("   Total: %s", formatAmount(total)), PDType1Font.HELVETICA_BOLD);
        }

        writeText(state, " ");
    }

    private void writeTitle(PageState state, String title) throws IOException {
        writeText(state, title, PDType1Font.HELVETICA_BOLD, 18f);
        writeText(state, " ");
    }

    private void writeWrappedText(PageState state, String text) throws IOException {
        int maxChars = 90;
        String remaining = text;
        while (remaining.length() > maxChars) {
            int breakIndex = remaining.lastIndexOf(' ', maxChars);
            if (breakIndex <= 0) {
                breakIndex = maxChars;
            }
            writeText(state, remaining.substring(0, breakIndex));
            remaining = remaining.substring(breakIndex).trim();
        }
        if (!remaining.isBlank()) {
            writeText(state, remaining);
        }
    }

    private void writeText(PageState state, String text) throws IOException {
        writeText(state, text, PDType1Font.HELVETICA, 12f);
    }

    private void writeText(PageState state, String text, org.apache.pdfbox.pdmodel.font.PDFont font) throws IOException {
        writeText(state, text, font, 12f);
    }

    private void writeText(PageState state, String text, org.apache.pdfbox.pdmodel.font.PDFont font, float fontSize) throws IOException {
        ensureSpace(state);
        state.stream.beginText();
        state.stream.setFont(font, fontSize);
        state.stream.newLineAtOffset(MARGIN, state.y);
        state.stream.showText(text);
        state.stream.endText();
        state.y -= LINE_HEIGHT;
    }

    private void ensureSpace(PageState state) throws IOException {
        if (state.y <= MARGIN) {
            state.stream.close();
            state.page = new PDPage(PDRectangle.A4);
            state.document.addPage(state.page);
            state.stream = new PDPageContentStream(state.document, state.page);
            state.y = state.page.getMediaBox().getHeight() - MARGIN;
        }
    }

    private String formatAmount(BigDecimal value) {
        if (value == null) {
            return "0.00";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String repeat(char c, int count) {
        return String.valueOf(c).repeat(count);
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return "";
        }
        return text.length() <= max ? text : text.substring(0, max - 3) + "...";
    }

    private PageState newPage(PDDocument document) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        PDPageContentStream stream = new PDPageContentStream(document, page);
        float startY = page.getMediaBox().getHeight() - MARGIN;
        return new PageState(document, page, stream, startY);
    }

    private static class PageState {
        private final PDDocument document;
        private PDPage page;
        private PDPageContentStream stream;
        private float y;

        private PageState(PDDocument document, PDPage page, PDPageContentStream stream, float y) {
            this.document = document;
            this.page = page;
            this.stream = stream;
            this.y = y;
        }
    }
}
