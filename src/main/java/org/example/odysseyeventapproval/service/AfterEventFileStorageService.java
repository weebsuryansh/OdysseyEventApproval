package org.example.odysseyeventapproval.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class AfterEventFileStorageService {
    private final Path root = Paths.get("data", "after-event-files");
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;
    private static final int BUFFER_SIZE = 8192;
    private final SecretKey secretKey;

    public AfterEventFileStorageService(@Value("${budget.photos.encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            throw new IllegalStateException("After-event file encryption key is not configured");
        }
        byte[] decoded = Base64.getDecoder().decode(encryptionKey);
        if (decoded.length != 16 && decoded.length != 24 && decoded.length != 32) {
            throw new IllegalStateException("After-event file encryption key must be 16, 24, or 32 bytes when decoded");
        }
        this.secretKey = new SecretKeySpec(decoded, "AES");
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("After-event file is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.startsWith("image/") || contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("After-event files must be images or PDFs");
        }

        String filename = UUID.randomUUID() + extensionFor(file.getOriginalFilename());
        try {
            Files.createDirectories(root);
            Path target = root.resolve(filename);
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            try (InputStream inputStream = file.getInputStream();
                 OutputStream outputStream = Files.newOutputStream(target)) {
                outputStream.write(iv);
                try (CipherOutputStream cipherOutputStream = new CipherOutputStream(outputStream, initCipher(Cipher.ENCRYPT_MODE, iv))) {
                    byte[] buffer = new byte[BUFFER_SIZE];
                    int read;
                    while ((read = inputStream.read(buffer)) != -1) {
                        cipherOutputStream.write(buffer, 0, read);
                    }
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Unable to store after-event file", e);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to encrypt after-event file", e);
        }
        return filename;
    }

    public Resource loadAsResource(String filename) {
        byte[] bytes = loadBytes(filename);
        if (bytes.length == 0) {
            throw new IllegalArgumentException("After-event file not found");
        }
        return new ByteArrayResource(bytes);
    }

    public byte[] loadBytes(String filename) {
        Path file = root.resolve(filename).normalize();
        if (!file.startsWith(root)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        if (!Files.exists(file)) {
            throw new IllegalArgumentException("After-event file not found");
        }
        try {
            byte[] data = Files.readAllBytes(file);
            if (data.length <= IV_LENGTH) {
                return data;
            }
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(data, 0, iv, 0, IV_LENGTH);
            byte[] cipherText = new byte[data.length - IV_LENGTH];
            System.arraycopy(data, IV_LENGTH, cipherText, 0, cipherText.length);
            try (CipherInputStream cipherInputStream = new CipherInputStream(new java.io.ByteArrayInputStream(cipherText), initCipher(Cipher.DECRYPT_MODE, iv))) {
                return cipherInputStream.readAllBytes();
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("After-event file not found", e);
        } catch (GeneralSecurityException e) {
            return loadLegacyBytes(file);
        }
    }

    private byte[] loadLegacyBytes(Path file) {
        try {
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw new IllegalArgumentException("After-event file not found", e);
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("Unable to decrypt after-event file", e);
        }
    }

    public String contentTypeFor(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".bmp")) {
            return "image/bmp";
        }
        if (lower.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "application/octet-stream";
    }

    private String extensionFor(String originalName) {
        if (originalName == null) {
            return "";
        }
        int lastDot = originalName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == originalName.length() - 1) {
            return "";
        }
        return originalName.substring(lastDot);
    }

    private Cipher initCipher(int mode, byte[] iv) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(mode, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        return cipher;
    }
}
