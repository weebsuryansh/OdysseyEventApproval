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
public class BudgetPhotoStorageService {
    private final Path root = Paths.get("data", "budget-photos");
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;
    private static final int BUFFER_SIZE = 8192;
    private final SecretKey secretKey;

    public BudgetPhotoStorageService(@Value("${budget.photos.encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            throw new IllegalStateException("Budget photo encryption key is not configured");
        }
        byte[] decoded = Base64.getDecoder().decode(encryptionKey);
        if (decoded.length != 16 && decoded.length != 24 && decoded.length != 32) {
            throw new IllegalStateException("Budget photo encryption key must be 16, 24, or 32 bytes when decoded");
        }
        this.secretKey = new SecretKeySpec(decoded, "AES");
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Budget photo is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Budget photos must be image files");
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
            throw new IllegalStateException("Unable to store budget photo", e);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to encrypt budget photo", e);
        }
        return filename;
    }

    public Resource loadAsResource(String filename) {
        byte[] bytes = loadBytes(filename);
        if (bytes.length == 0) {
            throw new IllegalArgumentException("Budget photo not found");
        }
        return new ByteArrayResource(bytes);
    }

    public byte[] loadBytes(String filename) {
        Path file = root.resolve(filename).normalize();
        if (!file.startsWith(root)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        if (!Files.exists(file)) {
            throw new IllegalArgumentException("Budget photo not found");
        }
        try (InputStream inputStream = Files.newInputStream(file)) {
            byte[] iv = inputStream.readNBytes(IV_LENGTH);
            if (iv.length != IV_LENGTH) {
                throw new IllegalArgumentException("Budget photo not found");
            }
            try (CipherInputStream cipherInputStream = new CipherInputStream(inputStream, initCipher(Cipher.DECRYPT_MODE, iv))) {
                return cipherInputStream.readAllBytes();
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Budget photo not found", e);
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("Unable to decrypt budget photo", e);
        }
    }

    public Path resolve(String filename) {
        return root.resolve(filename).normalize();
    }

    public String contentTypeFor(String filename) {
        String lower = filename.toLowerCase();
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
