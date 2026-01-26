package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.SubEvent;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailNotificationService {
    private static final String FROM_EMAIL = "suryansh22519@iiitd.ac.in";
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final BudgetReportService budgetReportService;

    public EmailNotificationService(JavaMailSender mailSender, BudgetReportService budgetReportService) {
        this.mailSender = mailSender;
        this.budgetReportService = budgetReportService;
    }

    public void notifyStudentOnDecision(Event event, User student, UserRole approverRole, DecisionStatus decisionStatus, String remark) {
        String subject = "Event " + decisionStatus.name().toLowerCase() + " by " + formatRole(approverRole);
        StringBuilder body = new StringBuilder();
        body.append("An update was made to your event.\n\n")
                .append("Event: ").append(event.getTitle()).append("\n")
                .append("Stage: ").append(event.getStage()).append("\n")
                .append("Decision by ").append(formatRole(approverRole)).append(": ").append(decisionStatus).append("\n");
        if (remark != null && !remark.isBlank()) {
            body.append("Remark: ").append(remark).append("\n");
        }
        body.append("\nDescription:\n").append(event.getDescription()).append("\n")
                .append("\nSub-events:\n").append(formatSubEvents(event));

        String htmlBody = buildDecisionHtml(event, approverRole, decisionStatus, remark);
        sendEmail(student.getEmail(), subject, body.toString(), htmlBody);
    }

    public void notifyApproverForStage(Event event, User approver) {
        String subject = "Event awaiting " + formatRole(approver.getRole()) + " approval";
        StringBuilder body = new StringBuilder();
        body.append("An event requires your approval.\n\n")
                .append("Event: ").append(event.getTitle()).append("\n")
                .append("Created by: ").append(event.getStudent().getDisplayName()).append("\n")
                .append("Stage: ").append(event.getStage()).append("\n")
                .append("\nDescription:\n").append(event.getDescription()).append("\n")
                .append("\nSub-events:\n").append(formatSubEvents(event));

        String htmlBody = buildApproverHtml(event);
        sendEmail(approver.getEmail(), subject, body.toString(), htmlBody, buildApproverAttachments(event));
    }

    public void notifyStudentOnPocDecision(Event event, User student, SubEvent subEvent, boolean accepted) {
        String subject = "POC response received for " + event.getTitle();
        StringBuilder body = new StringBuilder();
        body.append("A POC has responded to your event.\n\n")
                .append("Event: ").append(event.getTitle()).append("\n")
                .append("Sub-event: ").append(subEvent.getName()).append("\n")
                .append("POC: ").append(subEvent.getPocName()).append("\n")
                .append("Decision: ").append(accepted ? "ACCEPTED" : "DECLINED").append("\n")
                .append("Stage: ").append(event.getStage()).append("\n")
                .append("\nDescription:\n").append(event.getDescription()).append("\n");

        String htmlBody = buildPocDecisionHtml(event, subEvent, accepted);
        sendEmail(student.getEmail(), subject, body.toString(), htmlBody);
    }

    private String formatSubEvents(Event event) {
        return event.getSubEvents().stream()
                .map(this::formatSubEvent)
                .collect(Collectors.joining("\n"));
    }

    private String formatSubEvent(SubEvent subEvent) {
        return "- " + subEvent.getName()
                + " (Club: " + subEvent.getClub().getName()
                + ", POC: " + subEvent.getPocName()
                + ", Budget: " + subEvent.getBudgetTotal()
                + ", Status: " + subEvent.getPocStatus()
                + ")";
    }

    private String formatRole(UserRole role) {
        return role == null ? "Approver" : role.name().replace('_', ' ');
    }

    private void sendEmail(String intendedRecipient, String subject, String plainText, String htmlBody) {
        sendEmail(intendedRecipient, subject, plainText, htmlBody, List.of());
    }

    private void sendEmail(String intendedRecipient, String subject, String plainText, String htmlBody, List<EmailAttachment> attachments) {
        List<EmailAttachment> safeAttachments = attachments == null ? List.of() : List.copyOf(attachments);
        Thread senderThread = new Thread(() -> sendEmailInternal(intendedRecipient, subject, plainText, htmlBody, safeAttachments));
        senderThread.setName("email-sender-" + System.currentTimeMillis());
        senderThread.setDaemon(true);
        senderThread.start();
    }

    private void sendEmailInternal(String intendedRecipient, String subject, String plainText, String htmlBody, List<EmailAttachment> attachments) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(intendedRecipient);
            helper.setSubject(subject);
            helper.setText(withIntendedRecipient(intendedRecipient, plainText), wrapEmailHtml(htmlBody, intendedRecipient));
            for (EmailAttachment attachment : attachments) {
                helper.addAttachment(attachment.filename(), new ByteArrayResource(attachment.data()), attachment.contentType());
            }
            mailSender.send(message);
        } catch (MailException | MessagingException ex) {
            LOGGER.warn("Email delivery failed to {} (intended recipient {}).", intendedRecipient, intendedRecipient, ex);
        }
    }

    private String buildDecisionHtml(Event event, UserRole approverRole, DecisionStatus decisionStatus, String remark) {
        StringBuilder body = new StringBuilder();
        body.append("<p style=\"margin:0 0 16px;color:#1f2937;font-size:15px;\">")
                .append("An update was made to your event.")
                .append("</p>")
                .append(buildDetailCard(event, formatRole(approverRole), decisionStatus.name(), remark))
                .append(buildDescriptionSection(event.getDescription()))
                .append(buildSubEventSection(event));
        return wrapContent("Event update", "Decision recorded", body.toString());
    }

    private String buildApproverHtml(Event event) {
        StringBuilder body = new StringBuilder();
        body.append("<p style=\"margin:0 0 16px;color:#1f2937;font-size:15px;\">")
                .append("An event requires your approval.")
                .append("</p>")
                .append(buildApproverCard(event))
                .append(buildDescriptionSection(event.getDescription()))
                .append(buildSubEventSection(event));
        return wrapContent("Approval needed", "Event action required", body.toString());
    }

    private List<EmailAttachment> buildApproverAttachments(Event event) {
        List<EmailAttachment> attachments = new ArrayList<>();
        String eventId = event.getId() == null ? "unknown" : event.getId().toString();
        try {
            byte[] preEventReport = budgetReportService.generatePreEventReport(event);
            attachments.add(new EmailAttachment(
                    "event-" + eventId + "-pre-event.pdf",
                    preEventReport,
                    "application/pdf"
            ));
            byte[] inflowOutflowReport = budgetReportService.generateInflowOutflowReport(event);
            attachments.add(new EmailAttachment(
                    "event-" + eventId + "-inflow-outflow.pdf",
                    inflowOutflowReport,
                    "application/pdf"
            ));
        } catch (RuntimeException ex) {
            LOGGER.warn("Unable to attach reports for event {}.", eventId, ex);
        }
        return attachments;
    }

    private String buildPocDecisionHtml(Event event, SubEvent subEvent, boolean accepted) {
        StringBuilder body = new StringBuilder();
        body.append("<p style=\"margin:0 0 16px;color:#1f2937;font-size:15px;\">")
                .append("A POC has responded to your event.")
                .append("</p>")
                .append(buildPocCard(event, subEvent, accepted))
                .append(buildDescriptionSection(event.getDescription()));
        return wrapContent("POC response", "Decision recorded", body.toString());
    }

    private String buildDetailCard(Event event, String role, String decision, String remark) {
        StringBuilder card = new StringBuilder();
        card.append("<div style=\"margin:0 0 16px;padding:16px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;\">")
                .append("<p style=\"margin:0 0 10px;font-weight:700;color:#0f172a;\">Event details</p>")
                .append("<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;\">")
                .append(buildRow("Event", escapeHtml(event.getTitle())))
                .append(buildRow("Stage", String.valueOf(event.getStage())))
                .append(buildRow("Decision by", escapeHtml(role)))
                .append(buildRow("Decision", escapeHtml(decision)));
        if (remark != null && !remark.isBlank()) {
            card.append(buildRow("Remark", escapeHtml(remark)));
        }
        card.append("</table></div>");
        return card.toString();
    }

    private String buildApproverCard(Event event) {
        return "<div style=\"margin:0 0 16px;padding:16px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;\">"
                + "<p style=\"margin:0 0 10px;font-weight:700;color:#0f172a;\">Event details</p>"
                + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;\">"
                + buildRow("Event", escapeHtml(event.getTitle()))
                + buildRow("Created by", escapeHtml(event.getStudent().getDisplayName()))
                + buildRow("Stage", String.valueOf(event.getStage()))
                + "</table></div>";
    }

    private String buildPocCard(Event event, SubEvent subEvent, boolean accepted) {
        return "<div style=\"margin:0 0 16px;padding:16px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;\">"
                + "<p style=\"margin:0 0 10px;font-weight:700;color:#0f172a;\">POC response</p>"
                + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;\">"
                + buildRow("Event", escapeHtml(event.getTitle()))
                + buildRow("Sub-event", escapeHtml(subEvent.getName()))
                + buildRow("POC", escapeHtml(subEvent.getPocName()))
                + buildRow("Decision", escapeHtml(accepted ? "ACCEPTED" : "DECLINED"))
                + buildRow("Stage", String.valueOf(event.getStage()))
                + "</table></div>";
    }

    private String buildDescriptionSection(String description) {
        if (description == null || description.isBlank()) {
            return "";
        }
        return "<div style=\"margin:0 0 16px;\">"
                + "<p style=\"margin:0 0 6px;font-weight:700;color:#0f172a;\">Description</p>"
                + "<p style=\"margin:0;color:#475569;line-height:1.5;\">"
                + escapeHtml(description)
                + "</p></div>";
    }

    private String buildSubEventSection(Event event) {
        if (event.getSubEvents() == null || event.getSubEvents().isEmpty()) {
            return "<div style=\"margin:0;\">"
                    + "<p style=\"margin:0 0 6px;font-weight:700;color:#0f172a;\">Sub-events</p>"
                    + "<p style=\"margin:0;color:#64748b;\">No sub-events listed yet.</p>"
                    + "</div>";
        }
        String listItems = event.getSubEvents().stream()
                .map(this::formatSubEventHtml)
                .collect(Collectors.joining(""));
        return "<div style=\"margin:0;\">"
                + "<p style=\"margin:0 0 6px;font-weight:700;color:#0f172a;\">Sub-events</p>"
                + "<ul style=\"margin:0;padding-left:18px;color:#475569;\">"
                + listItems
                + "</ul></div>";
    }

    private String formatSubEventHtml(SubEvent subEvent) {
        return "<li style=\"margin:0 0 8px;\">"
                + "<strong style=\"color:#0f172a;\">"
                + escapeHtml(subEvent.getName())
                + "</strong>"
                + " &mdash; Club: " + escapeHtml(subEvent.getClub().getName())
                + ", POC: " + escapeHtml(subEvent.getPocName())
                + ", Budget: " + escapeHtml(String.valueOf(subEvent.getBudgetTotal()))
                + ", Status: " + escapeHtml(String.valueOf(subEvent.getPocStatus()))
                + "</li>";
    }

    private String buildRow(String label, String value) {
        return "<tr><td style=\"padding:4px 0;color:#64748b;width:140px;\">"
                + escapeHtml(label)
                + "</td><td style=\"padding:4px 0;font-weight:600;color:#0f172a;\">"
                + escapeHtml(value)
                + "</td></tr>";
    }

    private String wrapContent(String title, String subtitle, String body) {
        return "<h2 style=\"margin:0 0 12px;font-size:20px;color:#0f172a;\">"
                + escapeHtml(title)
                + "</h2>"
                + "<p style=\"margin:0 0 16px;color:#64748b;font-size:14px;\">"
                + escapeHtml(subtitle)
                + "</p>"
                + body;
    }

    private String wrapEmailHtml(String body, String intendedRecipient) {
        String recipient = intendedRecipient == null || intendedRecipient.isBlank()
                ? "(missing email on user)"
                : intendedRecipient;
        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head><meta charset=\"UTF-8\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f4f7fb;\">"
                + "<tr><td align=\"center\" style=\"padding:32px 16px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,0.08);\">"
                + "<tr><td style=\"background:#0f5560;color:#ffffff;padding:24px 28px;\">"
                + "<p style=\"margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;\">Events Portal</p>"
                + "<h1 style=\"margin:6px 0 0;font-size:22px;\">Event Approval Update</h1>"
                + "</td></tr>"
                + "<tr><td style=\"padding:24px 28px;\">"
                + body
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px;\">"
                + "<p style=\"margin:0;\">Intended recipient: "
                + escapeHtml(recipient)
                + "</p>"
                + "</td></tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body></html>";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String withIntendedRecipient(String intendedRecipient, String text) {
        if (intendedRecipient == null || intendedRecipient.isBlank()) {
            return text + "\n\nIntended recipient: (missing email on user)";
        }
        return text + "\n\nIntended recipient: " + intendedRecipient;
    }

    private record EmailAttachment(String filename, byte[] data, String contentType) {
    }
}
