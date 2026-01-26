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
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host}") String host,
            @Value("${spring.mail.port}") int port,
            @Value("${spring.mail.username}") String username,
            @Value("${spring.mail.password}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean auth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean starttlsEnable,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean starttlsRequired,
            @Value("${spring.mail.properties.mail.debug:false}") boolean debug
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties p = sender.getJavaMailProperties();
        p.put("mail.transport.protocol", "smtp");
        p.put("mail.smtp.auth", String.valueOf(auth));
        p.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnable));
        p.put("mail.smtp.starttls.required", String.valueOf(starttlsRequired));
        p.put("mail.debug", String.valueOf(debug));

        // IMPORTANT: don't enable SSL on 587
        p.put("mail.smtp.ssl.enable", "false");

        LOGGER.info("Mail sender configured for {}:{} with STARTTLS={}", host, port, starttlsEnable);
        return sender;
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
