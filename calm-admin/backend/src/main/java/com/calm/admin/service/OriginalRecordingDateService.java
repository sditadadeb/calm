package com.calm.admin.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class OriginalRecordingDateService {

    private static final Logger log = LoggerFactory.getLogger(OriginalRecordingDateService.class);
    private static final String CSV_PATH = "migration/calm-fechas-originales.csv";
    private static final String S3_PREFIX = "recorder/company-calm-953/";

    private final Map<String, Instant> datesByRecordingId = new HashMap<>();
    private final Map<String, Instant> datesByFlatId = new HashMap<>();

    @PostConstruct
    public void loadOriginalDates() {
        try {
            ClassPathResource resource = new ClassPathResource(CSV_PATH);
            if (!resource.exists()) {
                log.warn("Original dates CSV not found at {}", CSV_PATH);
                return;
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine(); // header
                int count = 0;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    String[] parts = parseCsvLine(line);
                    if (parts.length < 2) continue;

                    String recordingId = s3PathToRecordingId(parts[0]);
                    Instant instant = OffsetDateTime.parse(parts[1]).toInstant();

                    datesByRecordingId.put(recordingId, instant);
                    datesByFlatId.put(S3Service.flatRecordingId(recordingId), instant);
                    count++;
                }
                log.info("Loaded {} original recording dates from CSV (Jun 9-11)", count);
            }
        } catch (Exception e) {
            log.error("Failed to load original recording dates CSV: {}", e.getMessage());
        }
    }

    public Optional<Instant> getOriginalDate(String recordingId) {
        Instant direct = datesByRecordingId.get(recordingId);
        if (direct != null) return Optional.of(direct);
        Instant flat = datesByFlatId.get(S3Service.flatRecordingId(recordingId));
        return Optional.ofNullable(flat);
    }

    public boolean hasOriginalDate(String recordingId) {
        return getOriginalDate(recordingId).isPresent();
    }

    private String s3PathToRecordingId(String archivo) {
        String path = archivo.trim();
        if (path.startsWith("\"") && path.endsWith("\"")) {
            path = path.substring(1, path.length() - 1);
        }
        if (path.startsWith(S3_PREFIX)) {
            path = path.substring(S3_PREFIX.length());
        }
        if (path.endsWith(".webm")) {
            path = path.substring(0, path.length() - 5);
        }
        return path;
    }

    /** Simple CSV parser for quoted fields */
    private String[] parseCsvLine(String line) {
        java.util.List<String> fields = new java.util.ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }
}
