package com.calm.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

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
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.metadata.bucket}")
    private String metadataBucket;

    @Value("${aws.s3.metadata.prefix}")
    private String metadataPrefix;

    @Value("${aws.s3.transcriptions.bucket}")
    private String transcriptionsBucket;

    @Value("${aws.s3.transcriptions.prefix}")
    private String transcriptionsPrefix;

    public S3Service(
            @Qualifier("metadataS3Client") S3Client metadataS3Client,
            @Qualifier("transcriptionsS3Client") S3Client transcriptionsS3Client,
            ObjectMapper objectMapper) {
        this.metadataS3Client = metadataS3Client;
        this.transcriptionsS3Client = transcriptionsS3Client;
        this.objectMapper = objectMapper;
    }

    public List<String> listAllRecordingIds() {
        List<String> recordingIds = new ArrayList<>();
        
        try {
            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(metadataBucket)
                    .prefix(metadataPrefix)
                    .build();

            ListObjectsV2Response response = metadataS3Client.listObjectsV2(request);
            
            for (S3Object object : response.contents()) {
                String key = object.key();
                if (key.endsWith(".json")) {
                    String fileName = key.substring(key.lastIndexOf("/") + 1);
                    String recordingId = fileName.replace(".json", "");
                    recordingIds.add(recordingId);
                }
            }
            
            log.info("Found {} recording IDs in metadata bucket", recordingIds.size());
        } catch (Exception e) {
            log.error("Error listing objects from metadata bucket: {}", e.getMessage());
        }
        
        return recordingIds;
    }

    public Map<String, Object> getMetadata(String recordingId) {
        Map<String, Object> metadata = new HashMap<>();
        
        try {
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
        try {
            String key = transcriptionsPrefix + "in-person-recording-" + recordingId + ".webm-transcription.json";
            
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(transcriptionsBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = transcriptionsS3Client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            JsonNode root = objectMapper.readTree(content);
            StringBuilder transcriptionText = new StringBuilder();
            
            if (root.isArray()) {
                for (JsonNode segment : root) {
                    if (segment.has("text")) {
                        transcriptionText.append(segment.get("text").asText()).append(" ");
                    } else if (segment.has("transcript")) {
                        transcriptionText.append(segment.get("transcript").asText()).append(" ");
                    }
                }
            } else if (root.has("results")) {
                JsonNode results = root.get("results");
                if (results.has("transcripts") && results.get("transcripts").isArray()) {
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

    public boolean transcriptionExists(String recordingId) {
        try {
            String key = transcriptionsPrefix + "in-person-recording-" + recordingId + ".webm-transcription.json";
            
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(transcriptionsBucket)
                    .key(key)
                    .build();

            transcriptionsS3Client.headObject(request);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Error checking transcription existence for {}: {}", recordingId, e.getMessage());
            return false;
        }
    }
}
