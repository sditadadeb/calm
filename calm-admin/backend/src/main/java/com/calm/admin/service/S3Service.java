package com.calm.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    private final S3Client metadataS3Client;
    private final S3Client transcriptionsS3Client;
    private final S3Presigner metadataS3Presigner;
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.metadata.bucket}")
    private String metadataBucket;

    @Value("${aws.s3.metadata.prefix}")
    private String metadataPrefix;

    @Value("${aws.s3.transcriptions.bucket}")
    private String transcriptionsBucket;

    @Value("${aws.s3.transcriptions.prefix}")
    private String transcriptionsPrefix;

    @Autowired
    public S3Service(
            @Qualifier("metadataS3Client") @Nullable S3Client metadataS3Client,
            @Qualifier("transcriptionsS3Client") @Nullable S3Client transcriptionsS3Client,
            @Qualifier("metadataS3Presigner") @Nullable S3Presigner metadataS3Presigner,
            ObjectMapper objectMapper) {
        this.metadataS3Client = metadataS3Client;
        this.transcriptionsS3Client = transcriptionsS3Client;
        this.metadataS3Presigner = metadataS3Presigner;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return metadataS3Client != null;
    }

    public List<String> listAllRecordingIds() {
        List<String> recordingIds = new ArrayList<>();

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured. Returning empty list.");
            return recordingIds;
        }

        try {
            // List subfolders (branches) using delimiter
            List<String> subfolderPrefixes = new ArrayList<>();
            String subfolderToken = null;
            do {
                ListObjectsV2Request.Builder req = ListObjectsV2Request.builder()
                        .bucket(metadataBucket)
                        .prefix(metadataPrefix)
                        .delimiter("/");
                if (subfolderToken != null) req.continuationToken(subfolderToken);

                ListObjectsV2Response resp = metadataS3Client.listObjectsV2(req.build());
                for (CommonPrefix cp : resp.commonPrefixes()) {
                    subfolderPrefixes.add(cp.prefix());
                }
                subfolderToken = resp.isTruncated() ? resp.nextContinuationToken() : null;
            } while (subfolderToken != null);

            log.info("Found {} subfolders under prefix '{}'", subfolderPrefixes.size(), metadataPrefix);

            if (subfolderPrefixes.isEmpty()) {
                // Fallback: flat listing (legacy format, no subfolders)
                log.info("No subfolders found, falling back to flat listing");
                return listAllRecordingIdsFlat();
            }

            // For each subfolder, list its files and extract IDs from .json filenames
            for (String subfolderPrefix : subfolderPrefixes) {
                String continuationToken = null;
                do {
                    ListObjectsV2Request.Builder requestBuilder = ListObjectsV2Request.builder()
                            .bucket(metadataBucket)
                            .prefix(subfolderPrefix);
                    if (continuationToken != null) requestBuilder.continuationToken(continuationToken);

                    ListObjectsV2Response response = metadataS3Client.listObjectsV2(requestBuilder.build());

                    for (S3Object object : response.contents()) {
                        String key = object.key();
                        if (key.endsWith(".json")) {
                            // recordingId = path relative to metadataPrefix, without extension
                            // e.g. "in-person-recording/4477/abc123.json" -> "4477/abc123"
                            String relativePath = key.substring(metadataPrefix.length());
                            String recordingId = relativePath.replace(".json", "");
                            recordingIds.add(recordingId);
                        }
                    }

                    continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
                } while (continuationToken != null);
            }

            log.info("Found {} recording IDs across {} subfolders in metadata bucket",
                    recordingIds.size(), subfolderPrefixes.size());
        } catch (Exception e) {
            log.error("Error listing objects from metadata bucket: {}", e.getMessage());
        }

        return recordingIds;
    }

    private List<String> listAllRecordingIdsFlat() {
        List<String> recordingIds = new ArrayList<>();
        try {
            String continuationToken = null;
            int pages = 0;
            do {
                ListObjectsV2Request.Builder requestBuilder = ListObjectsV2Request.builder()
                        .bucket(metadataBucket)
                        .prefix(metadataPrefix);
                if (continuationToken != null) requestBuilder.continuationToken(continuationToken);

                ListObjectsV2Response response = metadataS3Client.listObjectsV2(requestBuilder.build());
                pages++;

                for (S3Object object : response.contents()) {
                    String key = object.key();
                    if (key.endsWith(".json")) {
                        String fileName = key.substring(key.lastIndexOf("/") + 1);
                        recordingIds.add(fileName.replace(".json", ""));
                    }
                }

                continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
            } while (continuationToken != null);

            log.info("Flat listing: found {} recording IDs ({} pages)", recordingIds.size(), pages);
        } catch (Exception e) {
            log.error("Error in flat listing: {}", e.getMessage());
        }
        return recordingIds;
    }

    public Map<String, Object> getMetadata(String recordingId) {
        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return new HashMap<>();
        }

        // Try CSV first (new format: {prefix}{subfolder}/{id}.csv)
        Map<String, Object> csvMetadata = readMetadataFromCsv(recordingId);
        if (!csvMetadata.isEmpty()) {
            return csvMetadata;
        }

        // Fallback to JSON (legacy format: {prefix}{id}.json)
        return readMetadataFromJson(recordingId);
    }

    private Map<String, Object> readMetadataFromCsv(String recordingId) {
        Map<String, Object> metadata = new HashMap<>();
        try {
            String key = metadataPrefix + recordingId + ".csv";

            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = metadataS3Client.getObject(request);
            List<String> lines = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.toList());

            if (lines.size() < 2) {
                log.warn("CSV metadata for {} has no data rows", recordingId);
                return metadata;
            }

            String[] headers = lines.get(0).split(",", -1);
            String[] values = lines.get(1).split(",", -1);

            for (int i = 0; i < headers.length && i < values.length; i++) {
                String header = headers[i].trim().toLowerCase().replaceAll("[\"']", "");
                String value = values[i].trim().replaceAll("[\"']", "");

                switch (header) {
                    case "user_id", "userid" -> {
                        try { metadata.put("userId", Long.parseLong(value)); } catch (NumberFormatException ignored) {}
                    }
                    case "user_name", "username", "user" -> metadata.put("userName", value);
                    case "branch_id", "branchid" -> {
                        try { metadata.put("branchId", Long.parseLong(value)); } catch (NumberFormatException ignored) {}
                    }
                    case "branch_name", "branchname", "branch" -> metadata.put("branchName", value);
                }
            }

            log.info("Retrieved CSV metadata for recording {}", recordingId);
        } catch (NoSuchKeyException e) {
            // Expected when CSV doesn't exist (old format)
        } catch (Exception e) {
            log.error("Error reading CSV metadata for recording {}: {}", recordingId, e.getMessage());
        }
        return metadata;
    }

    private Map<String, Object> readMetadataFromJson(String recordingId) {
        Map<String, Object> metadata = new HashMap<>();
        try {
            // Legacy: file is at {prefix}{recordingId}.json (flat, no subfolder)
            String flatId = recordingId.contains("/") ? recordingId.substring(recordingId.lastIndexOf("/") + 1) : recordingId;
            String key = metadataPrefix + flatId + ".json";

            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = metadataS3Client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            JsonNode root = objectMapper.readTree(content);

            if (root.has("user")) {
                JsonNode user = root.get("user");
                metadata.put("userId", user.has("id") ? user.get("id").asLong() : null);
                metadata.put("userName", user.has("name") ? user.get("name").asText() : null);
            }

            if (root.has("branch")) {
                JsonNode branch = root.get("branch");
                metadata.put("branchId", branch.has("id") ? branch.get("id").asLong() : null);
                metadata.put("branchName", branch.has("name") ? branch.get("name").asText() : null);
            }

            log.info("Retrieved JSON metadata for recording {}", recordingId);
        } catch (NoSuchKeyException e) {
            log.warn("Metadata not found for recording {}", recordingId);
        } catch (Exception e) {
            log.error("Error reading JSON metadata for recording {}: {}", recordingId, e.getMessage());
        }
        return metadata;
    }

    public String getTranscription(String recordingId) {
        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return null;
        }

        try {
            // New format: {prefix}{subfolder}/{id}.json (subfolder is part of recordingId)
            String key = metadataPrefix + recordingId + ".json";
            
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = metadataS3Client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            JsonNode root = objectMapper.readTree(content);
            StringBuilder transcriptionText = new StringBuilder();
            
            if (root.isArray()) {
                String lastSpeaker = null;
                for (JsonNode segment : root) {
                    String text = null;
                    String speaker = null;
                    
                    // Obtener el texto
                    if (segment.has("text")) {
                        text = segment.get("text").asText();
                    } else if (segment.has("transcript")) {
                        text = segment.get("transcript").asText();
                    }
                    
                    // Obtener el speaker
                    if (segment.has("speaker")) {
                        speaker = segment.get("speaker").asText();
                    } else if (segment.has("speaker_label")) {
                        speaker = segment.get("speaker_label").asText();
                    }
                    
                    if (text != null && !text.isBlank()) {
                        // Si hay speaker y es diferente al último, agregar etiqueta
                        if (speaker != null && !speaker.equals(lastSpeaker)) {
                            if (transcriptionText.length() > 0) {
                                transcriptionText.append("\n\n");
                            }
                            // Convertir spk_0, spk_1 a nombres más legibles
                            String speakerLabel = formatSpeakerLabel(speaker);
                            transcriptionText.append("[").append(speakerLabel).append("]: ");
                            lastSpeaker = speaker;
                        } else if (speaker == null && transcriptionText.length() > 0) {
                            transcriptionText.append(" ");
                        }
                        transcriptionText.append(text);
                    }
                }
            } else if (root.has("results")) {
                JsonNode results = root.get("results");
                // AWS Transcribe format con speaker labels
                if (results.has("speaker_labels") && results.has("items")) {
                    transcriptionText.append(parseAwsTranscribeWithSpeakers(results));
                } else if (results.has("transcripts") && results.get("transcripts").isArray()) {
                    for (JsonNode transcript : results.get("transcripts")) {
                        transcriptionText.append(transcript.get("transcript").asText()).append(" ");
                    }
                }
            } else if (root.has("text")) {
                transcriptionText.append(root.get("text").asText());
            } else if (root.has("transcript")) {
                transcriptionText.append(root.get("transcript").asText());
            } else {
                transcriptionText.append(content);
            }
            
            log.info("Retrieved transcription for recording {} ({} chars)", recordingId, transcriptionText.length());
            return transcriptionText.toString().trim();
            
        } catch (NoSuchKeyException e) {
            log.warn("Transcription not found for recording {}", recordingId);
            return null;
        } catch (Exception e) {
            log.error("Error reading transcription for recording {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Convierte etiquetas de speaker (spk_0, spk_1, speaker_0, etc.) a nombres legibles.
     */
    private String formatSpeakerLabel(String speaker) {
        if (speaker == null) return "Desconocido";
        
        String normalized = speaker.toLowerCase().trim();
        
        // spk_0, speaker_0, spk0 -> Persona 1
        if (normalized.matches(".*[_]?0$") || normalized.equals("spk0")) {
            return "Persona 1";
        }
        if (normalized.matches(".*[_]?1$") || normalized.equals("spk1")) {
            return "Persona 2";
        }
        if (normalized.matches(".*[_]?2$") || normalized.equals("spk2")) {
            return "Persona 3";
        }
        if (normalized.matches(".*[_]?3$") || normalized.equals("spk3")) {
            return "Persona 4";
        }
        
        // Si tiene un formato reconocible, extraer el número
        if (normalized.startsWith("spk") || normalized.startsWith("speaker")) {
            String num = normalized.replaceAll("[^0-9]", "");
            if (!num.isEmpty()) {
                int n = Integer.parseInt(num) + 1;
                return "Persona " + n;
            }
        }
        
        return speaker; // Devolver original si no se reconoce
    }
    
    /**
     * Parsea el formato AWS Transcribe con speaker labels.
     */
    private String parseAwsTranscribeWithSpeakers(JsonNode results) {
        StringBuilder text = new StringBuilder();
        
        try {
            if (!results.has("items")) {
                return "";
            }
            
            JsonNode items = results.get("items");
            String lastSpeaker = null;
            
            for (JsonNode item : items) {
                if (item.has("alternatives") && item.get("alternatives").isArray() 
                    && item.get("alternatives").size() > 0) {
                    
                    String content = item.get("alternatives").get(0).get("content").asText();
                    String speaker = item.has("speaker_label") ? item.get("speaker_label").asText() : null;
                    String type = item.has("type") ? item.get("type").asText() : "pronunciation";
                    
                    if (speaker != null && !speaker.equals(lastSpeaker)) {
                        if (text.length() > 0) {
                            text.append("\n\n");
                        }
                        text.append("[").append(formatSpeakerLabel(speaker)).append("]: ");
                        lastSpeaker = speaker;
                    }
                    
                    // No agregar espacio antes de puntuación
                    if ("punctuation".equals(type)) {
                        text.append(content);
                    } else {
                        if (text.length() > 0 && !text.toString().endsWith(": ") && !text.toString().endsWith("\n")) {
                            text.append(" ");
                        }
                        text.append(content);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing AWS Transcribe format: {}", e.getMessage());
        }
        
        return text.toString();
    }

    public boolean transcriptionExists(String recordingId) {
        if (metadataS3Client == null) {
            return false;
        }

        try {
            String key = metadataPrefix + recordingId + ".json";

            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();

            metadataS3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking transcription existence for {}: {}", recordingId, e.getMessage());
            return false;
        }
    }

    public java.time.Instant getTranscriptionDate(String recordingId) {
        if (metadataS3Client == null) {
            return null;
        }

        try {
            String key = metadataPrefix + recordingId + ".json";

            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();

            HeadObjectResponse response = metadataS3Client.headObject(request);
            return response.lastModified();
        } catch (NoSuchKeyException e) {
            log.warn("Transcription file not found for recording {}", recordingId);
            return null;
        } catch (Exception e) {
            log.error("Error getting transcription date for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Verifica si existe el archivo de audio para una grabación.
     * @param recordingId ID de la grabación
     * @return true si el audio existe, false en caso contrario
     */
    public boolean audioExists(String recordingId) {
        if (metadataS3Client == null) {
            return false;
        }
        
        try {
            String key = metadataPrefix + recordingId + ".webm";
            
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();
            
            metadataS3Client.headObject(headRequest);
            return true;
            
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking audio existence for {}: {}", recordingId, e.getMessage());
            return false;
        }
    }
    
    /**
     * Obtiene el stream de audio desde S3 para proxy.
     * @param recordingId ID de la grabación
     * @return InputStream del audio o null si no existe
     */
    public ResponseInputStream<GetObjectResponse> getAudioStream(String recordingId) {
        return getAudioStream(recordingId, null);
    }
    
    /**
     * Obtiene el stream de audio desde S3 con soporte para Range requests.
     * @param recordingId ID de la grabación
     * @param range Rango de bytes a solicitar (formato: "bytes=start-end")
     * @return InputStream del audio o null si no existe
     */
    public ResponseInputStream<GetObjectResponse> getAudioStream(String recordingId, String range) {
        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured. Audio streaming not available.");
            return null;
        }
        
        try {
            String key = metadataPrefix + recordingId + ".webm";
            
            log.info("Streaming audio from S3: bucket={}, key={}, range={}", metadataBucket, key, range);
            
            GetObjectRequest.Builder requestBuilder = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key);
            
            // Si hay un rango, agregarlo a la solicitud
            if (range != null && !range.isEmpty()) {
                requestBuilder.range(range);
            }
            
            return metadataS3Client.getObject(requestBuilder.build());
            
        } catch (NoSuchKeyException e) {
            log.warn("Audio file not found for recording {} in bucket {}", recordingId, metadataBucket);
            return null;
        } catch (Exception e) {
            log.error("Error streaming audio for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Obtiene el tamaño del archivo de audio.
     * @param recordingId ID de la grabación
     * @return tamaño en bytes o -1 si no existe
     */
    public long getAudioSize(String recordingId) {
        if (metadataS3Client == null) {
            return -1;
        }
        
        try {
            String key = metadataPrefix + recordingId + ".webm";
            
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key)
                    .build();
            
            HeadObjectResponse response = metadataS3Client.headObject(headRequest);
            return response.contentLength();
            
        } catch (Exception e) {
            return -1;
        }
    }
}
