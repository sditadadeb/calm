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
    
    /**
     * Obtiene la fecha de creación/modificación del archivo de transcripción en S3.
     * Esta fecha representa cuándo se creó la grabación/atención.
     */
    public java.time.Instant getTranscriptionDate(String recordingId) {
        try {
            String key = transcriptionsPrefix + "in-person-recording-" + recordingId + ".webm-transcription.json";
            
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(transcriptionsBucket)
                    .key(key)
                    .build();

            HeadObjectResponse response = transcriptionsS3Client.headObject(request);
            return response.lastModified();
        } catch (NoSuchKeyException e) {
            log.warn("Transcription file not found for recording {}", recordingId);
            return null;
        } catch (Exception e) {
            log.error("Error getting transcription date for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
}
