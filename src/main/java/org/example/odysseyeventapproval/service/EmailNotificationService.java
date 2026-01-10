package org.example.odysseyeventapproval.service;

import org.example.odysseyeventapproval.model.DecisionStatus;
import org.example.odysseyeventapproval.model.Event;
import org.example.odysseyeventapproval.model.SubEvent;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class EmailNotificationService {
    private static final String TEST_TARGET_EMAIL = "suryansh22519@iiitd.ac.in";
    private static final String FROM_EMAIL = "suryansh22519@iiitd.ac.in";
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;

    public EmailNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
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

        sendEmail(student.getEmail(), subject, body.toString());
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

        sendEmail(approver.getEmail(), subject, body.toString());
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

        sendEmail(student.getEmail(), subject, body.toString());
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

    private void sendEmail(String intendedRecipient, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(FROM_EMAIL);
        message.setTo(TEST_TARGET_EMAIL);
        message.setSubject(subject);
        message.setText(withIntendedRecipient(intendedRecipient, text));
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            LOGGER.warn("Email delivery failed to {} (intended recipient {}).", TEST_TARGET_EMAIL, intendedRecipient, ex);
        }
    }

    private String withIntendedRecipient(String intendedRecipient, String text) {
        if (intendedRecipient == null || intendedRecipient.isBlank()) {
            return text + "\n\nIntended recipient: (missing email on user)";
        }
        return text + "\n\nIntended recipient: " + intendedRecipient;
    }
}
