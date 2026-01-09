package org.example.odysseyeventapproval.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class BudgetPhotoStorageService {
    private final Path root = Paths.get("data", "budget-photos");

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
            Files.copy(file.getInputStream(), root.resolve(filename));
        } catch (IOException e) {
            throw new IllegalStateException("Unable to store budget photo", e);
        }
        return filename;
    }

    public Resource loadAsResource(String filename) {
        try {
            Path file = root.resolve(filename).normalize();
            if (!file.startsWith(root)) {
                throw new IllegalArgumentException("Invalid file path");
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IllegalArgumentException("Budget photo not found");
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Budget photo not found", e);
        }
    }

    public Path resolve(String filename) {
        return root.resolve(filename).normalize();
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
}
