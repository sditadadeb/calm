package com.isl.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
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

    @Value("${aws.s3.metadata.audioSuffix:.webm}")
    private String metadataAudioSuffix;

    @Value("${aws.s3.transcriptions.bucket}")
    private String transcriptionsBucket;

    @Value("${aws.s3.transcriptions.prefix}")
    private String transcriptionsPrefix;

    @Value("${aws.s3.transcriptions.idPrefix:}")
    private String transcriptionsIdPrefix;

    @Value("${aws.s3.transcriptions.idSuffix:.json}")
    private String transcriptionsIdSuffix;

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

    public List<String> listAllRecordingIds() {
        List<String> recordingIds = new ArrayList<>();
        // Si hay prefix de metadata, listar desde el bucket de metadata; si no, desde el de transcripciones
        if (metadataS3Client != null && metadataPrefix != null && !metadataPrefix.isEmpty()) {
            try {
                Set<String> seen = new HashSet<>();
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
                        // Estructura: prefix/{uuid}/transcripcion.json → recordingId = {uuid}
                        if (!key.endsWith(".json")) continue;
                        String afterPrefix = key.length() > metadataPrefix.length()
                                ? key.substring(metadataPrefix.length()) : "";
                        int lastSlash = afterPrefix.lastIndexOf('/');
                        if (lastSlash <= 0) continue;
                        String recordingId = afterPrefix.substring(0, lastSlash);
                        if (!recordingId.isEmpty() && seen.add(recordingId)) {
                            recordingIds.add(recordingId);
                        }
                    }
                    continuationToken = response.isTruncated() ? response.nextContinuationToken() : null;
                } while (continuationToken != null);
                log.info("Found {} recording IDs in metadata bucket", recordingIds.size());
            } catch (Exception e) {
                log.error("Error listing objects from metadata bucket: {}", e.getMessage());
            }
            return recordingIds;
        }
        if (transcriptionsS3Client == null) {
            log.warn("S3 transcriptions client not configured. Returning empty list.");
            return recordingIds;
        }
        try {
            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(transcriptionsBucket)
                    .prefix(transcriptionsPrefix != null ? transcriptionsPrefix : "")
                    .build();
            ListObjectsV2Response response = transcriptionsS3Client.listObjectsV2(request);
            for (S3Object object : response.contents()) {
                String key = object.key();
                if (!key.endsWith(transcriptionsIdSuffix != null ? transcriptionsIdSuffix : ".json")) continue;
                String base = key.length() > transcriptionsPrefix.length() ? key.substring(transcriptionsPrefix.length()) : key;
                if (!base.endsWith(transcriptionsIdSuffix)) continue;
                String idPart = base.substring(0, base.length() - transcriptionsIdSuffix.length());
                if (transcriptionsIdPrefix != null && !transcriptionsIdPrefix.isEmpty() && idPart.startsWith(transcriptionsIdPrefix)) {
                    idPart = idPart.substring(transcriptionsIdPrefix.length());
                }
                if (!idPart.isEmpty()) recordingIds.add(idPart);
            }
            log.info("Found {} recording IDs in transcriptions bucket", recordingIds.size());
        } catch (Exception e) {
            log.error("Error listing objects from transcriptions bucket: {}", e.getMessage());
        }
        return recordingIds;
    }

    /**
     * Conteo liviano de IDs disponibles para evitar sync completo en cada request.
     */
    public int countAvailableRecordings() {
        try {
            return listAllRecordingIds().size();
        } catch (Exception e) {
            log.warn("No se pudo contar IDs disponibles en S3: {}", e.getMessage());
            return -1;
        }
    }

    public Map<String, Object> getMetadata(String recordingId) {
        Map<String, Object> metadata = new HashMap<>();
        
        if (metadataS3Client == null) {
            log.warn("S3 metadata client not configured.");
            return metadata;
        }
        
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

            // Soporte Carrefour: sucursal puede viajar en extraField/extraFields/extrafield
            enrichBranchFromExtraFields(root, metadata);
            
            log.info("Retrieved metadata for recording {}", recordingId);
        } catch (NoSuchKeyException e) {
            log.warn("Metadata not found for recording {}", recordingId);
        } catch (Exception e) {
            log.error("Error reading metadata for recording {}: {}", recordingId, e.getMessage());
        }
        
        return metadata;
    }

    public String getTranscription(String recordingId) {
        if (transcriptionsS3Client == null) {
            log.warn("S3 transcriptions client not configured.");
            return null;
        }
        
        try {
            String key = buildTranscriptionKey(recordingId);
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(transcriptionsBucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> response = transcriptionsS3Client.getObject(request);
            String content = new BufferedReader(new InputStreamReader(response, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));

            if (content == null || content.isBlank()) {
                log.warn("Transcription file is empty for recording {}", recordingId);
                return null;
            }

            JsonNode root;
            try {
                root = objectMapper.readTree(content);
            } catch (JsonProcessingException e) {
                // Some providers may store plain text or partially malformed JSON.
                // Importing raw content is better than dropping the transcription entirely.
                log.warn("Transcription JSON is invalid for recording {}. Importing raw content.", recordingId);
                return content.trim();
            }
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
        if (transcriptionsS3Client == null) {
            return false;
        }
        
        try {
            String key = buildTranscriptionKey(recordingId);
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
        if (transcriptionsS3Client == null) {
            return null;
        }
        
        try {
            String key = buildTranscriptionKey(recordingId);
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
            String key = metadataPrefix + recordingId + (metadataAudioSuffix != null ? metadataAudioSuffix : ".webm");
            
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
            String key = metadataPrefix + recordingId + (metadataAudioSuffix != null ? metadataAudioSuffix : ".webm");
            
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

    private String buildTranscriptionKey(String recordingId) {
        String prefix = transcriptionsPrefix != null ? transcriptionsPrefix : "";
        String idPrefix = transcriptionsIdPrefix != null ? transcriptionsIdPrefix : "";
        String idSuffix = transcriptionsIdSuffix != null ? transcriptionsIdSuffix : ".json";
        return prefix + idPrefix + recordingId + idSuffix;
    }

    private void enrichBranchFromExtraFields(JsonNode root, Map<String, Object> metadata) {
        if (root == null || metadata == null) return;

        JsonNode extra = firstNonNull(
                root.get("extraField"),
                root.get("extraFields"),
                root.get("extrafield")
        );
        if (extra == null || extra.isNull()) return;

        // Caso objeto: {"sucursal":"...", "branchName":"...", "branch":{"id":...,"name":"..."}}
        if (extra.isObject()) {
            JsonNode branchNode = firstNonNull(extra.get("branch"), extra.get("sucursal"));
            if (branchNode != null && branchNode.isObject()) {
                if ((metadata.get("branchId") == null) && branchNode.has("id") && branchNode.get("id").isNumber()) {
                    metadata.put("branchId", branchNode.get("id").asLong());
                }
                if (isBlank((String) metadata.get("branchName"))) {
                    String name = textOrNull(firstNonNull(branchNode.get("name"), branchNode.get("nombre")));
                    if (name != null) metadata.put("branchName", name);
                }
            } else {
                if (isBlank((String) metadata.get("branchName"))) {
                    String name = textOrNull(firstNonNull(
                            extra.get("branchName"),
                            extra.get("branch"),
                            extra.get("sucursal"),
                            extra.get("sucursalNombre"),
                            extra.get("store"),
                            extra.get("storeName")
                    ));
                    if (name != null) metadata.put("branchName", name);
                }
                if (metadata.get("branchId") == null) {
                    Long branchId = longOrNull(firstNonNull(
                            extra.get("branchId"),
                            extra.get("sucursalId"),
                            extra.get("storeId")
                    ));
                    if (branchId != null) metadata.put("branchId", branchId);
                }
            }
            return;
        }

        // Caso texto simple: extraField = "Sucursal X"
        if (extra.isTextual() && isBlank((String) metadata.get("branchName"))) {
            metadata.put("branchName", extra.asText());
        }
    }

    private JsonNode firstNonNull(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            if (node != null && !node.isNull()) return node;
        }
        return null;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (!node.isTextual()) return null;
        String value = node.asText();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Long longOrNull(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isNumber()) return node.asLong();
        if (node.isTextual()) {
            try { return Long.parseLong(node.asText().trim()); } catch (Exception ignored) {}
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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
            String key = metadataPrefix + recordingId + (metadataAudioSuffix != null ? metadataAudioSuffix : ".webm");
            
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
