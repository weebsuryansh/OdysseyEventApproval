package org.example.odysseyeventapproval.config;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {
    private static final Logger LOGGER = LoggerFactory.getLogger(MailConfig.class);

    @Bean
    public JavaMailSender javaMailSender(@Value("${spring.mail.host:}") String host,
                                         @Value("${spring.mail.port:25}") int port) {
        if (host == null || host.isBlank()) {
            return new NoOpJavaMailSender();
        }
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        LOGGER.info("Spring.mail.host Configured");
        return mailSender;
    }

    private static final class NoOpJavaMailSender implements JavaMailSender {
        @Override
        public MimeMessage createMimeMessage() {
            return new MimeMessage(Session.getDefaultInstance(new Properties()));
        }

        @Override
        public MimeMessage createMimeMessage(java.io.InputStream contentStream) {
            return new MimeMessage(Session.getDefaultInstance(new Properties()));
        }

        @Override
        public void send(MimeMessage mimeMessage) {
            LOGGER.info("Skipping email send because spring.mail.host is not configured.");
        }

        @Override
        public void send(MimeMessage... mimeMessages) {
            LOGGER.info("Skipping email send because spring.mail.host is not configured.");
        }

        @Override
        public void send(SimpleMailMessage simpleMessage) {
            LOGGER.info("Skipping email send because spring.mail.host is not configured.");
        }

        @Override
        public void send(SimpleMailMessage... simpleMessages) {
            LOGGER.info("Skipping email send because spring.mail.host is not configured.");
        }
    }
}
