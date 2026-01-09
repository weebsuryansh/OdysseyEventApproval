package org.example.odysseyeventapproval.controller;

import org.example.odysseyeventapproval.service.BudgetPhotoStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/budget-photos")
public class BudgetPhotoController {
    private final BudgetPhotoStorageService storageService;

    public BudgetPhotoController(BudgetPhotoStorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<String> upload(@RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Please upload at least one budget photo");
        }
        return Arrays.stream(files)
                .map(storageService::store)
                .map(filename -> "/api/budget-photos/" + filename)
                .collect(Collectors.toList());
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) throws IOException {
        Resource resource = storageService.loadAsResource(filename);
        String contentType = Files.probeContentType(storageService.resolve(filename));
        MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }
}
