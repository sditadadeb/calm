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
    /** Migration window: use old bucket dates for these days only */
    private static final Set<String> MIGRATION_DATES = Set.of("20260609", "20260610", "20260611");

    private final S3Client metadataS3Client;
    private final S3Client transcriptionsS3Client;
    private final S3Client newBucketS3Client;
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

    @Value("${aws.s3.newbucket.bucket}")
    private String newBucket;

    @Value("${aws.s3.newbucket.prefix}")
    private String newBucketPrefix;

    @Autowired
    public S3Service(
            @Qualifier("metadataS3Client") @Nullable S3Client metadataS3Client,
            @Qualifier("transcriptionsS3Client") @Nullable S3Client transcriptionsS3Client,
            @Qualifier("newBucketS3Client") @Nullable S3Client newBucketS3Client,
            @Qualifier("metadataS3Presigner") @Nullable S3Presigner metadataS3Presigner,
            ObjectMapper objectMapper) {
        this.metadataS3Client = metadataS3Client;
        this.transcriptionsS3Client = transcriptionsS3Client;
        this.newBucketS3Client = newBucketS3Client;
        this.metadataS3Presigner = metadataS3Presigner;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return metadataS3Client != null || newBucketS3Client != null;
    }

    public List<String> listAllRecordingIds() {
        if (metadataS3Client == null && newBucketS3Client == null) {
            log.warn("No S3 clients configured. Returning empty list.");
            return new ArrayList<>();
        }

        List<String> fromNew = listRecordingIdsFromNewBucket();
        Set<String> newFlatIds = fromNew.stream()
                .map(S3Service::flatRecordingId)
                .collect(Collectors.toSet());

        List<String> result = new ArrayList<>(fromNew);

        if (metadataS3Client != null) {
            List<String> fromOld = listRecordingIdsFromOldBucket();
            int skippedOverlap = 0;
            for (String id : fromOld) {
                if (newFlatIds.contains(flatRecordingId(id))) {
                    skippedOverlap++;
                } else {
                    result.add(id);
                }
            }
            log.info("Listed {} recordings ({} new bucket, {} old-only, {} skipped overlap with new)",
                    result.size(), fromNew.size(), result.size() - fromNew.size(), skippedOverlap);
        } else {
            log.info("Listed {} recordings (new bucket only)", result.size());
        }

        return result;
    }

    private List<String> listRecordingIdsFromOldBucket() {
        List<String> recordingIds = new ArrayList<>();
        try {
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

            if (subfolderPrefixes.isEmpty()) {
                return listAllRecordingIdsFlat();
            }

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
                        if (key.endsWith(".json") && !key.endsWith(".transcripcion.json")) {
                            String relativePath = key.substring(metadataPrefix.length());
                            recordingIds.add(relativePath.replace(".json", ""));
                        }
                    }

                    continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
                } while (continuationToken != null);
            }

            log.info("Found {} recording IDs in old metadata bucket", recordingIds.size());
        } catch (Exception e) {
            log.error("Error listing objects from metadata bucket: {}", e.getMessage());
        }
        return recordingIds;
    }

    public static String flatRecordingId(String recordingId) {
        if (recordingId == null) return null;
        int slash = recordingId.lastIndexOf('/');
        return slash >= 0 ? recordingId.substring(slash + 1) : recordingId;
    }

    public static boolean isMigrationPeriodRecording(String recordingId) {
        String flat = flatRecordingId(recordingId);
        if (flat == null) return false;
        for (String date : MIGRATION_DATES) {
            if (flat.contains("-" + date + "-")) return true;
        }
        return false;
    }

    private List<String> listRecordingIdsFromNewBucket() {
        List<String> ids = new ArrayList<>();
        if (newBucketS3Client == null) return ids;

        try {
            List<String> subfolderPrefixes = new ArrayList<>();
            String token = null;
            do {
                ListObjectsV2Request.Builder req = ListObjectsV2Request.builder()
                        .bucket(newBucket)
                        .prefix(newBucketPrefix)
                        .delimiter("/");
                if (token != null) req.continuationToken(token);
                ListObjectsV2Response resp = newBucketS3Client.listObjectsV2(req.build());
                for (CommonPrefix cp : resp.commonPrefixes()) {
                    subfolderPrefixes.add(cp.prefix());
                }
                token = resp.isTruncated() ? resp.nextContinuationToken() : null;
            } while (token != null);

            for (String subfolderPrefix : subfolderPrefixes) {
                String continuationToken = null;
                do {
                    ListObjectsV2Request.Builder rb = ListObjectsV2Request.builder()
                            .bucket(newBucket)
                            .prefix(subfolderPrefix);
                    if (continuationToken != null) rb.continuationToken(continuationToken);
                    ListObjectsV2Response response = newBucketS3Client.listObjectsV2(rb.build());

                    for (S3Object object : response.contents()) {
                        String key = object.key();
                        // Use .json (metadata) to identify recordings, exclude .transcripcion.json
                        if (key.endsWith(".json") && !key.endsWith(".transcripcion.json")) {
                            String relativePath = key.substring(newBucketPrefix.length());
                            String recordingId = relativePath.replace(".json", "");
                            ids.add(recordingId);
                        }
                    }
                    continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
                } while (continuationToken != null);
            }

            if (!ids.isEmpty()) {
                log.info("Found {} recording IDs in new bucket (calm-grabaciones)", ids.size());
            }
        } catch (Exception e) {
            log.error("Error listing from new bucket: {}", e.getMessage());
        }
        return ids;
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
                    if (key.endsWith(".json") && !key.endsWith(".transcripcion.json")) {
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
        // Try new bucket first
        Map<String, Object> newBucketMeta = readMetadataFromNewBucket(recordingId);
        if (!newBucketMeta.isEmpty()) return newBucketMeta;

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return new HashMap<>();
        }

        // Try CSV (new format in old bucket)
        Map<String, Object> csvMetadata = readMetadataFromCsv(recordingId);
        if (!csvMetadata.isEmpty()) return csvMetadata;

        // Fallback to JSON
        return readMetadataFromJson(recordingId);
    }

    private Map<String, Object> readMetadataFromNewBucket(String recordingId) {
        Map<String, Object> metadata = new HashMap<>();
        if (newBucketS3Client == null) return metadata;
        try {
            String key = newBucketPrefix + recordingId + ".json";
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(newBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = newBucketS3Client.getObject(request);
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

            if (!metadata.isEmpty()) {
                log.info("Retrieved metadata from new bucket for {}", recordingId);
            }
        } catch (NoSuchKeyException e) {
            // Not in new bucket
        } catch (Exception e) {
            log.error("Error reading metadata from new bucket for {}: {}", recordingId, e.getMessage());
        }
        return metadata;
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
            // Try full path first (new format: {prefix}{subfolder}/{id}.json)
            String key = metadataPrefix + recordingId + ".json";

            try {
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
                return metadata;
            } catch (NoSuchKeyException e) {
                // Full path not found, try legacy flat path
            }

            // Fallback: legacy flat path (strip subfolder)
            if (recordingId.contains("/")) {
                String flatId = recordingId.substring(recordingId.lastIndexOf("/") + 1);
                String flatKey = metadataPrefix + flatId + ".json";

                GetObjectRequest request = GetObjectRequest.builder()
                        .bucket(metadataBucket)
                        .key(flatKey)
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

                log.info("Retrieved JSON metadata (flat) for recording {}", recordingId);
            }
        } catch (NoSuchKeyException e) {
            log.warn("Metadata not found for recording {}", recordingId);
        } catch (Exception e) {
            log.error("Error reading JSON metadata for recording {}: {}", recordingId, e.getMessage());
        }
        return metadata;
    }

    private String getTranscriptionFromNewBucket(String recordingId) {
        if (newBucketS3Client == null) return null;
        try {
            String key = newBucketPrefix + recordingId + ".transcripcion.json";
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(newBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = newBucketS3Client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            JsonNode root = objectMapper.readTree(content);
            StringBuilder text = new StringBuilder();

            if (root.has("segments") && root.get("segments").isArray()) {
                JsonNode segments = root.get("segments");
                boolean hasSpeakers = false;
                for (JsonNode seg : segments) {
                    if (seg.has("speaker") || seg.has("speaker_label")) {
                        hasSpeakers = true;
                        break;
                    }
                }

                if (hasSpeakers) {
                    String lastSpeaker = null;
                    for (JsonNode segment : segments) {
                        String segText = segment.has("text") ? segment.get("text").asText() : null;
                        String speaker = segment.has("speaker") ? segment.get("speaker").asText() :
                                         segment.has("speaker_label") ? segment.get("speaker_label").asText() : null;
                        if (segText != null && !segText.isBlank()) {
                            if (speaker != null && !speaker.equals(lastSpeaker)) {
                                if (text.length() > 0) text.append("\n\n");
                                text.append("[").append(formatSpeakerLabel(speaker)).append("]: ");
                                lastSpeaker = speaker;
                            } else if (text.length() > 0) {
                                text.append(" ");
                            }
                            text.append(segText);
                        }
                    }
                } else {
                    // No speakers: format with line breaks between segments for GPT diarization
                    double lastEnd = -1;
                    for (JsonNode segment : segments) {
                        String segText = segment.has("text") ? segment.get("text").asText() : null;
                        if (segText != null && !segText.isBlank()) {
                            double start = segment.has("start") ? segment.get("start").asDouble() : 0;
                            // New line when there's a gap > 1.5s (likely speaker change)
                            if (lastEnd >= 0 && (start - lastEnd) > 1.5) {
                                text.append("\n");
                            } else if (text.length() > 0) {
                                text.append(" ");
                            }
                            text.append(segText);
                            lastEnd = segment.has("end") ? segment.get("end").asDouble() : start;
                        }
                    }
                }
            } else if (root.isArray()) {
                for (JsonNode segment : root) {
                    String segText = segment.has("text") ? segment.get("text").asText() :
                                     segment.has("transcript") ? segment.get("transcript").asText() : null;
                    if (segText != null && !segText.isBlank()) {
                        if (text.length() > 0) text.append(" ");
                        text.append(segText);
                    }
                }
            } else if (root.has("transcript")) {
                text.append(root.get("transcript").asText());
            } else if (root.has("text")) {
                text.append(root.get("text").asText());
            } else {
                text.append(content);
            }

            String result = text.toString().trim();
            if (!result.isEmpty()) {
                log.info("Retrieved transcription from new bucket for {} ({} chars)", recordingId, result.length());
                return result;
            }
        } catch (NoSuchKeyException e) {
            // Not in new bucket
        } catch (Exception e) {
            log.error("Error reading transcription from new bucket for {}: {}", recordingId, e.getMessage());
        }
        return null;
    }

    public String getTranscription(String recordingId) {
        // Try new bucket first (.transcripcion.json format)
        String fromNewBucket = getTranscriptionFromNewBucket(recordingId);
        if (fromNewBucket != null) return fromNewBucket;

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return null;
        }

        try {
            // Old format: {prefix}{subfolder}/{id}.json (subfolder is part of recordingId)
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

            // Detect metadata-only JSON (not a transcription)
            if (root.isObject() && (root.has("user") || root.has("branch")) && !root.has("text") && !root.has("transcript") && !root.has("results")) {
                log.info("File for {} is metadata, not transcription", recordingId);
                return null;
            }
            
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
        if (existsInNewBucket(recordingId)) return true;
        if (existsInOldBucket(recordingId)) return true;
        return audioExists(recordingId);
    }

    private boolean existsInNewBucket(String recordingId) {
        if (newBucketS3Client == null) return false;
        for (String suffix : List.of(".transcripcion.json", ".json", ".webm")) {
            try {
                newBucketS3Client.headObject(HeadObjectRequest.builder()
                        .bucket(newBucket)
                        .key(newBucketPrefix + recordingId + suffix)
                        .build());
                return true;
            } catch (NoSuchKeyException e) { /* try next */ }
            catch (Exception e) {
                log.error("Error checking new bucket for {}: {}", recordingId, e.getMessage());
                return false;
            }
        }
        return false;
    }

    private boolean existsInOldBucket(String recordingId) {
        if (metadataS3Client == null) return false;
        try {
            metadataS3Client.headObject(HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(metadataPrefix + recordingId + ".json")
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking old bucket for {}: {}", recordingId, e.getMessage());
            return false;
        }
    }

    public java.time.Instant getTranscriptionDate(String recordingId) {
        // June 9-11: date from old bucket (migration window). After that: new bucket only.
        if (isMigrationPeriodRecording(recordingId)) {
            java.time.Instant oldDate = getMetadataDateFromOldBucket(recordingId);
            if (oldDate != null) return oldDate;
            return getMetadataDateFromNewBucket(recordingId);
        }
        java.time.Instant newDate = getMetadataDateFromNewBucket(recordingId);
        if (newDate != null) return newDate;
        return getMetadataDateFromOldBucket(recordingId);
    }

    private java.time.Instant getMetadataDateFromNewBucket(String recordingId) {
        if (newBucketS3Client == null) return null;
        try {
            HeadObjectResponse resp = newBucketS3Client.headObject(HeadObjectRequest.builder()
                    .bucket(newBucket)
                    .key(newBucketPrefix + recordingId + ".json")
                    .build());
            return resp.lastModified();
        } catch (NoSuchKeyException e) {
            return null;
        } catch (Exception e) {
            log.error("Error getting date from new bucket for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }

    private java.time.Instant getMetadataDateFromOldBucket(String recordingId) {
        if (metadataS3Client == null) return null;
        try {
            HeadObjectResponse resp = metadataS3Client.headObject(HeadObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(metadataPrefix + recordingId + ".json")
                    .build());
            return resp.lastModified();
        } catch (NoSuchKeyException e) {
            return null;
        } catch (Exception e) {
            log.error("Error getting date from old bucket for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Verifica si existe el archivo de audio para una grabación.
     * @param recordingId ID de la grabación
     * @return true si el audio existe, false en caso contrario
     */
    public boolean audioExists(String recordingId) {
        // Check new bucket first
        if (newBucketS3Client != null) {
            try {
                String key = newBucketPrefix + recordingId + ".webm";
                newBucketS3Client.headObject(HeadObjectRequest.builder().bucket(newBucket).key(key).build());
                return true;
            } catch (NoSuchKeyException e) { /* not here */ }
            catch (Exception e) { /* try old bucket */ }
        }
        if (metadataS3Client == null) return false;
        try {
            String key = metadataPrefix + recordingId + ".webm";
            metadataS3Client.headObject(HeadObjectRequest.builder().bucket(metadataBucket).key(key).build());
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
        // Try new bucket first
        if (newBucketS3Client != null) {
            try {
                String key = newBucketPrefix + recordingId + ".webm";
                GetObjectRequest.Builder rb = GetObjectRequest.builder().bucket(newBucket).key(key);
                if (range != null && !range.isEmpty()) rb.range(range);
                return newBucketS3Client.getObject(rb.build());
            } catch (NoSuchKeyException e) { /* try old bucket */ }
            catch (Exception e) { /* try old bucket */ }
        }

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured. Audio streaming not available.");
            return null;
        }
        
        try {
            String key = metadataPrefix + recordingId + ".webm";
            GetObjectRequest.Builder requestBuilder = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key);
            if (range != null && !range.isEmpty()) {
                requestBuilder.range(range);
            }
            return metadataS3Client.getObject(requestBuilder.build());
        } catch (NoSuchKeyException e) {
            log.warn("Audio file not found for recording {}", recordingId);
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
        // Try new bucket first
        if (newBucketS3Client != null) {
            try {
                String key = newBucketPrefix + recordingId + ".webm";
                HeadObjectResponse resp = newBucketS3Client.headObject(
                    HeadObjectRequest.builder().bucket(newBucket).key(key).build());
                return resp.contentLength();
            } catch (NoSuchKeyException e) { /* try old bucket */ }
            catch (Exception e) { /* try old bucket */ }
        }
        if (metadataS3Client == null) return -1;
        try {
            String key = metadataPrefix + recordingId + ".webm";
            HeadObjectResponse response = metadataS3Client.headObject(
                HeadObjectRequest.builder().bucket(metadataBucket).key(key).build());
            return response.contentLength();
        } catch (Exception e) {
            return -1;
        }
    }
}
