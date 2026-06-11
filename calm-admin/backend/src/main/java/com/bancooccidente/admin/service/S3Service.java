package com.bancooccidente.admin.service;

import com.bancooccidente.admin.dto.S3RecordingRef;
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

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);
    private static final Pattern RECORDING_TIMESTAMP = Pattern.compile("(\\d{8})-(\\d{6})");

    private final S3Client metadataS3Client;
    private final S3Client transcriptionsS3Client;
    private final S3Presigner metadataS3Presigner;
    private final ObjectMapper objectMapper;
    private final Map<String, String> recordingBaseKeyCache = new ConcurrentHashMap<>();

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
        return metadataS3Client != null && transcriptionsS3Client != null;
    }

    private boolean isOccidenteLayout() {
        return metadataPrefix != null && metadataPrefix.contains("recorder");
    }

    public List<S3RecordingRef> listAllRecordings() {
        List<S3RecordingRef> refs = new ArrayList<>();
        recordingBaseKeyCache.clear();

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured. Returning empty list.");
            return refs;
        }

        try {
            String continuationToken = null;
            do {
                ListObjectsV2Request.Builder requestBuilder = ListObjectsV2Request.builder()
                        .bucket(metadataBucket)
                        .prefix(metadataPrefix);

                if (continuationToken != null) {
                    requestBuilder.continuationToken(continuationToken);
                }

                ListObjectsV2Response response = metadataS3Client.listObjectsV2(requestBuilder.build());

                for (S3Object object : response.contents()) {
                    String key = object.key();
                    if (!key.endsWith(".json") || key.endsWith(".transcripcion.json")) {
                        continue;
                    }

                    String fileName = key.substring(key.lastIndexOf('/') + 1);
                    String recordingId = fileName.replace(".json", "");
                    String s3BaseKey = key.substring(0, key.lastIndexOf('/') + 1);

                    refs.add(new S3RecordingRef(recordingId, s3BaseKey));
                    recordingBaseKeyCache.put(recordingId, s3BaseKey);
                }

                continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
            } while (continuationToken != null);

            log.info("Found {} recordings in bucket {} (prefix={})", refs.size(), metadataBucket, metadataPrefix);
        } catch (Exception e) {
            log.error("Error listing objects from metadata bucket: {}", e.getMessage());
        }

        return refs;
    }

    public List<String> listAllRecordingIds() {
        return listAllRecordings().stream()
                .map(S3RecordingRef::recordingId)
                .toList();
    }

    public Map<String, Object> getMetadata(String recordingId) {
        return getMetadata(recordingId, null);
    }

    public Map<String, Object> getMetadata(String recordingId, String s3BaseKey) {
        Map<String, Object> metadata = new HashMap<>();

        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return metadata;
        }

        try {
            String key = metadataObjectKey(recordingId, s3BaseKey);

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

            log.info("Retrieved metadata for recording {}", recordingId);
        } catch (NoSuchKeyException e) {
            log.warn("Metadata not found for recording {}", recordingId);
        } catch (Exception e) {
            log.error("Error reading metadata for recording {}: {}", recordingId, e.getMessage());
        }

        return metadata;
    }

    public String getTranscription(String recordingId) {
        return getTranscription(recordingId, null);
    }

    public String getTranscription(String recordingId, String s3BaseKey) {
        S3Client client = transcriptionsClient();
        if (client == null) {
            log.warn("S3 transcriptions client not configured.");
            return null;
        }

        try {
            String key = transcriptionObjectKey(recordingId, s3BaseKey);

            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(transcriptionsBucketName())
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            JsonNode root = objectMapper.readTree(content);
            StringBuilder transcriptionText = new StringBuilder();

            if (root.has("segments") && root.get("segments").isArray()) {
                for (JsonNode segment : root.get("segments")) {
                    if (segment.has("text") && !segment.get("text").asText().isBlank()) {
                        if (transcriptionText.length() > 0) {
                            transcriptionText.append(" ");
                        }
                        transcriptionText.append(segment.get("text").asText().trim());
                    }
                }
            } else if (root.isArray()) {
                String lastSpeaker = null;
                for (JsonNode segment : root) {
                    String text = null;
                    String speaker = null;

                    if (segment.has("text")) {
                        text = segment.get("text").asText();
                    } else if (segment.has("transcript")) {
                        text = segment.get("transcript").asText();
                    }

                    if (segment.has("speaker")) {
                        speaker = segment.get("speaker").asText();
                    } else if (segment.has("speaker_label")) {
                        speaker = segment.get("speaker_label").asText();
                    }

                    if (text != null && !text.isBlank()) {
                        if (speaker != null && !speaker.equals(lastSpeaker)) {
                            if (transcriptionText.length() > 0) {
                                transcriptionText.append("\n\n");
                            }
                            transcriptionText.append("[").append(formatSpeakerLabel(speaker)).append("]: ");
                            lastSpeaker = speaker;
                        } else if (speaker == null && transcriptionText.length() > 0) {
                            transcriptionText.append(" ");
                        }
                        transcriptionText.append(text);
                    }
                }
            } else if (root.has("results")) {
                JsonNode results = root.get("results");
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

    private String formatSpeakerLabel(String speaker) {
        if (speaker == null) return "Desconocido";

        String normalized = speaker.toLowerCase().trim();

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

        if (normalized.startsWith("spk") || normalized.startsWith("speaker")) {
            String num = normalized.replaceAll("[^0-9]", "");
            if (!num.isEmpty()) {
                int n = Integer.parseInt(num) + 1;
                return "Persona " + n;
            }
        }

        return speaker;
    }

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
        return transcriptionExists(recordingId, null);
    }

    public boolean transcriptionExists(String recordingId, String s3BaseKey) {
        S3Client client = transcriptionsClient();
        if (client == null) {
            return false;
        }

        try {
            String key = transcriptionObjectKey(recordingId, s3BaseKey);

            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(transcriptionsBucketName())
                    .key(key)
                    .build();

            client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking transcription existence for {}: {}", recordingId, e.getMessage());
            return false;
        }
    }

    public Instant getTranscriptionDate(String recordingId) {
        return getTranscriptionDate(recordingId, null);
    }

    public Instant getTranscriptionDate(String recordingId, String s3BaseKey) {
        S3Client client = transcriptionsClient();
        if (client == null) {
            return parseRecordingDateFromId(recordingId);
        }

        try {
            String key = transcriptionObjectKey(recordingId, s3BaseKey);

            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(transcriptionsBucketName())
                    .key(key)
                    .build();

            HeadObjectResponse response = client.headObject(request);
            return response.lastModified();
        } catch (NoSuchKeyException e) {
            log.warn("Transcription file not found for recording {}", recordingId);
            return parseRecordingDateFromId(recordingId);
        } catch (Exception e) {
            log.error("Error getting transcription date for {}: {}", recordingId, e.getMessage());
            return parseRecordingDateFromId(recordingId);
        }
    }

    public boolean audioExists(String recordingId) {
        return audioExists(recordingId, null);
    }

    public boolean audioExists(String recordingId, String s3BaseKey) {
        if (metadataS3Client == null) {
            return false;
        }

        try {
            String key = audioObjectKey(recordingId, s3BaseKey);

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

    public ResponseInputStream<GetObjectResponse> getAudioStream(String recordingId) {
        return getAudioStream(recordingId, null, null);
    }

    public ResponseInputStream<GetObjectResponse> getAudioStream(String recordingId, String range) {
        return getAudioStream(recordingId, range, null);
    }

    public ResponseInputStream<GetObjectResponse> getAudioStream(String recordingId, String range, String s3BaseKey) {
        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured. Audio streaming not available.");
            return null;
        }

        try {
            String key = audioObjectKey(recordingId, s3BaseKey);

            log.debug("Streaming audio from S3 for recording {}, range={}", recordingId, range);

            GetObjectRequest.Builder requestBuilder = GetObjectRequest.builder()
                    .bucket(metadataBucket)
                    .key(key);

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

    public long getAudioSize(String recordingId) {
        return getAudioSize(recordingId, null);
    }

    public long getAudioSize(String recordingId, String s3BaseKey) {
        if (metadataS3Client == null) {
            return -1;
        }

        try {
            String key = audioObjectKey(recordingId, s3BaseKey);

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

    private S3Client transcriptionsClient() {
        return isOccidenteLayout() ? metadataS3Client : transcriptionsS3Client;
    }

    private String transcriptionsBucketName() {
        return isOccidenteLayout() ? metadataBucket : transcriptionsBucket;
    }

    private String resolveBaseKey(String recordingId, String s3BaseKey) {
        if (s3BaseKey != null && !s3BaseKey.isBlank()) {
            return s3BaseKey.endsWith("/") ? s3BaseKey : s3BaseKey + "/";
        }

        String cached = recordingBaseKeyCache.get(recordingId);
        if (cached != null) {
            return cached;
        }

        if (isOccidenteLayout()) {
            String found = findBaseKeyByScan(recordingId);
            if (found != null) {
                recordingBaseKeyCache.put(recordingId, found);
                return found;
            }
        }

        return metadataPrefix.endsWith("/") ? metadataPrefix : metadataPrefix + "/";
    }

    private String findBaseKeyByScan(String recordingId) {
        if (metadataS3Client == null) {
            return null;
        }

        try {
            String continuationToken = null;
            do {
                ListObjectsV2Request.Builder requestBuilder = ListObjectsV2Request.builder()
                        .bucket(metadataBucket)
                        .prefix(metadataPrefix);

                if (continuationToken != null) {
                    requestBuilder.continuationToken(continuationToken);
                }

                ListObjectsV2Response response = metadataS3Client.listObjectsV2(requestBuilder.build());

                for (S3Object object : response.contents()) {
                    String key = object.key();
                    if (key.contains(recordingId)) {
                        return key.substring(0, key.lastIndexOf('/') + 1);
                    }
                }

                continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
            } while (continuationToken != null);
        } catch (Exception e) {
            log.warn("Could not resolve S3 base key for {}: {}", recordingId, e.getMessage());
        }

        return null;
    }

    private String metadataObjectKey(String recordingId, String s3BaseKey) {
        return resolveBaseKey(recordingId, s3BaseKey) + recordingId + ".json";
    }

    private String transcriptionObjectKey(String recordingId, String s3BaseKey) {
        if (isOccidenteLayout()) {
            return resolveBaseKey(recordingId, s3BaseKey) + recordingId + ".transcripcion.json";
        }
        String prefix = transcriptionsPrefix.endsWith("/") ? transcriptionsPrefix : transcriptionsPrefix + "/";
        return prefix + "in-person-recording-" + recordingId + ".webm-transcription.json";
    }

    private String audioObjectKey(String recordingId, String s3BaseKey) {
        return resolveBaseKey(recordingId, s3BaseKey) + recordingId + ".webm";
    }

    private Instant parseRecordingDateFromId(String recordingId) {
        Matcher matcher = RECORDING_TIMESTAMP.matcher(recordingId);
        if (matcher.find()) {
            try {
                LocalDateTime dateTime = LocalDateTime.parse(
                        matcher.group(1) + matcher.group(2),
                        DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                );
                return dateTime.atZone(ZoneId.systemDefault()).toInstant();
            } catch (Exception e) {
                log.debug("Could not parse recording date from id {}: {}", recordingId, e.getMessage());
            }
        }
        return null;
    }
}
