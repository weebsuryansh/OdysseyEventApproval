package org.example.odysseyeventapproval.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.example.odysseyeventapproval.dto.BudgetItemDto;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.SubEvent;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class BudgetReportService {
    private static final float MARGIN = 40f;
    private static final float LINE_HEIGHT = 16f;
    private static final PDType1Font FONT_HELVETICA = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDType1Font FONT_HELVETICA_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDType1Font FONT_COURIER = new PDType1Font(Standard14Fonts.FontName.COURIER);
    private static final PDType1Font FONT_COURIER_BOLD = new PDType1Font(Standard14Fonts.FontName.COURIER_BOLD);

    public byte[] generateEventBudgetReport(Event event) {
        try (PDDocument document = new PDDocument()) {
            PageState state = newPage(document);

            writeTitle(state, "Event Budget Summary");
            writeText(state, String.format("Event: %s", event.getTitle()), FONT_HELVETICA_BOLD);
            writeWrappedText(state, String.format("Description: %s", event.getDescription()));
            writeText(state, String.format("Student Owner: %s", event.getStudent().getDisplayName()));
            writeText(state, " ");

            writeTableHeader(state);
            BigDecimal grandTotal = BigDecimal.ZERO;
            for (SubEvent subEvent : event.getSubEvents()) {
                List<BudgetItemDto> items = BudgetItemDto.parse(subEvent.getBudgetBreakdown());
                BigDecimal subTotal = resolveBudgetTotal(subEvent, items);
                grandTotal = grandTotal.add(subTotal);
                writeSubEvent(state, subEvent, items, subTotal);
            }

            writeText(state, " ");
            writeText(state, "Overall totals", FONT_HELVETICA_BOLD, 14f);
            writeText(state, String.format("Event budget (all sub-events): %s", formatAmount(grandTotal)), FONT_HELVETICA_BOLD);

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
        writeText(state, repeat('=', 95), FONT_COURIER);
        writeText(state, String.format("%-26s %-16s %-14s %-19s %12s", "Sub-Event", "POC", "Phone", "Budget Head", "Total (INR)"), FONT_COURIER_BOLD);
        writeText(state, String.format("%-26s %-16s %-14s %-19s %12s", repeat('-', 12), repeat('-', 8), repeat('-', 8), repeat('-', 10), repeat('-', 10)), FONT_COURIER);
    }

    private void writeSubEvent(PageState state, SubEvent subEvent, List<BudgetItemDto> items, BigDecimal total) throws IOException {
<<<<<<< Updated upstream
        List<String> nameLines = wrap(subEvent.getName(), 26);
        List<String> pocLines = wrap(subEvent.getPocName(), 16);
        List<String> phoneLines = wrap(subEvent.getPocPhone(), 14);
        List<String> headLines = wrap(subEvent.getBudgetHead(), 19);

        int lineCount = Math.max(Math.max(nameLines.size(), pocLines.size()), Math.max(phoneLines.size(), headLines.size()));
        for (int i = 0; i < lineCount; i++) {
            String header = String.format(
                    "%-26s %-16s %-14s %-19s %12s",
                    getLine(nameLines, i),
                    getLine(pocLines, i),
                    getLine(phoneLines, i),
                    getLine(headLines, i),
                    i == 0 ? formatAmount(total) : ""
            );
            writeText(state, header, FONT_COURIER);
        }

        writeWrappedWithPrefix(state, "      Budget head (sanctioned by): ", subEvent.getBudgetHead(), 90);
=======
        String header = String.format(
                "%-26s %-16s %-14s %-19s %12s",
                truncate(subEvent.getName(), 26),
                truncate(subEvent.getPocName(), 16),
                truncate(subEvent.getPocPhone(), 14),
                truncate(subEvent.getBudgetHead(), 19),
                formatAmount(total)
        );
        writeText(state, header, FONT_COURIER);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

        if (items.isEmpty()) {
            writeText(state, "         • No budget items provided", FONT_COURIER);
        } else {
            for (BudgetItemDto item : items) {
                List<String> descLines = wrap(item.getDescription(), 52);
                for (int idx = 0; idx < descLines.size(); idx++) {
                    String line = String.format("         %s %-52s %10s",
                            idx == 0 ? "•" : " ",
                            descLines.get(idx),
                            idx == 0 ? formatAmount(item.getAmount()) : "");
                    writeText(state, line, FONT_COURIER);
                }
            }
            writeText(state, String.format("      Sub-total: %s", formatAmount(total)), FONT_HELVETICA_BOLD);
        }

        writeText(state, repeat('-', 95), FONT_COURIER);
    }

    private BigDecimal resolveBudgetTotal(SubEvent subEvent, List<BudgetItemDto> items) {
        BigDecimal total = subEvent.getBudgetTotal();
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            total = calculateTotal(items);
        }
        return total;
    }

    private BigDecimal calculateTotal(List<BudgetItemDto> items) {
        BigDecimal total = BigDecimal.ZERO;
        if (items == null) {
            return total;
        }
        for (BudgetItemDto item : items) {
            total = total.add(item.getAmount() == null ? BigDecimal.ZERO : item.getAmount());
        }
        return total;
    }

    private void writeTitle(PageState state, String title) throws IOException {
        writeText(state, title, FONT_HELVETICA_BOLD, 18f);
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
        writeText(state, text, FONT_HELVETICA, 12f);
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

    private List<String> wrap(String text, int max) {
        if (text == null || text.isBlank()) {
            return List.of("");
        }

        String remaining = text.trim();
        List<String> lines = new ArrayList<>();
        while (remaining.length() > max) {
            int breakIndex = remaining.lastIndexOf(' ', max);
            if (breakIndex <= 0) {
                breakIndex = max;
            }
            lines.add(remaining.substring(0, breakIndex).trim());
            remaining = remaining.substring(breakIndex).trim();
        }
        if (!remaining.isEmpty()) {
            lines.add(remaining);
        }
        return lines.isEmpty() ? List.of("") : lines;
    }

    private void writeWrappedWithPrefix(PageState state, String prefix, String text, int maxWidth) throws IOException {
        List<String> lines = wrap(text, Math.max(1, maxWidth - prefix.length()));
        for (int i = 0; i < lines.size(); i++) {
            String prefixToUse = i == 0 ? prefix : " ".repeat(prefix.length());
            writeText(state, prefixToUse + lines.get(i));
        }
    }

    private String getLine(List<String> lines, int index) {
        if (index < 0 || index >= lines.size()) {
            return "";
        }
        return lines.get(index);
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
