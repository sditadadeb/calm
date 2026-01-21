package com.numia.surveys.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class BulkGateService {
    
    private static final Logger log = LoggerFactory.getLogger(BulkGateService.class);
    
    @Value("${bulkgate.application-id}")
    private String applicationId;
    
    @Value("${bulkgate.application-token}")
    private String applicationToken;
    
    @Value("${bulkgate.base-url:https://portal.bulkgate.com/api/1.0/simple}")
    private String baseUrl;
    
    private final ObjectMapper objectMapper;

    public BulkGateService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    public CompletableFuture<SmsResponse> sendSms(String to, String message) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("=== INICIANDO ENVÍO DE SMS (BulkGate) ===");
                log.info("Configuración BulkGate:");
                log.info("  - Base URL: {}", baseUrl);
                log.info("  - Application ID: {}", applicationId);
                log.info("  - Application Token: {}...", applicationToken != null && applicationToken.length() > 10 ? applicationToken.substring(0, 10) : "NO CONFIGURADO");
                log.info("  - Teléfono destino original: {}", to);
                
                String normalizedPhone = normalizePhoneNumber(to);
                log.info("  - Teléfono normalizado: {}", normalizedPhone);
                log.info("  - Mensaje: {}", message);
                
                // BulkGate API endpoint for transactional SMS
                URL url = new URL(baseUrl + "/transactional");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                // BulkGate request body format
                Map<String, Object> requestBody = Map.of(
                    "application_id", applicationId,
                    "application_token", applicationToken,
                    "number", normalizedPhone,
                    "text", message
                );
                
                String jsonInputString = objectMapper.writeValueAsString(requestBody);
                
                log.info("Enviando request a BulkGate API...");
                log.info("URL: {}", url);
                log.info("Request body: {}", jsonInputString);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                log.info("HTTP Response Code: {}", responseCode);

                StringBuilder response = new StringBuilder();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(responseCode >= 200 && responseCode < 300 ? conn.getInputStream() : conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                }
                
                log.info("=== RESPUESTA DE BULKGATE ===");
                log.info("Response: {}", response.toString());

                // Parse BulkGate response
                JsonNode jsonResponse = objectMapper.readTree(response.toString());
                
                if (responseCode >= 200 && responseCode < 300) {
                    // Check if BulkGate returned success
                    if (jsonResponse.has("data") && jsonResponse.get("data").has("status")) {
                        String status = jsonResponse.get("data").get("status").asText();
                        if ("accepted".equalsIgnoreCase(status) || "sent".equalsIgnoreCase(status)) {
                            String smsId = jsonResponse.get("data").has("sms_id") ? 
                                jsonResponse.get("data").get("sms_id").asText() : "N/A";
                            return new SmsResponse(true, smsId, null);
                        }
                    }
                    // Alternative success check
                    if (jsonResponse.has("type") && "success".equalsIgnoreCase(jsonResponse.get("type").asText())) {
                        return new SmsResponse(true, response.toString(), null);
                    }
                    return new SmsResponse(true, response.toString(), null);
                } else {
                    String errorMsg = response.toString();
                    if (jsonResponse.has("error")) {
                        errorMsg = jsonResponse.get("error").asText();
                    } else if (jsonResponse.has("message")) {
                        errorMsg = jsonResponse.get("message").asText();
                    }
                    return new SmsResponse(false, null, responseCode + ": " + errorMsg);
                }
                
            } catch (Exception e) {
                log.error("=== ERROR ENVIANDO SMS ===");
                log.error("Teléfono: {}", to);
                log.error("Error tipo: {}", e.getClass().getName());
                log.error("Error mensaje: {}", e.getMessage());
                if (e.getCause() != null) {
                    log.error("Causa: {}", e.getCause().getMessage());
                }
                return new SmsResponse(false, null, e.getMessage());
            }
        });
    }
    
    public CompletableFuture<SmsResponse> sendBulkSms(List<String> recipients, String message) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                URL url = new URL(baseUrl + "/promotional");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                // Build number array for bulk send
                List<Map<String, String>> numbers = recipients.stream()
                    .map(phone -> Map.of("number", normalizePhoneNumber(phone)))
                    .toList();

                Map<String, Object> requestBody = Map.of(
                    "application_id", applicationId,
                    "application_token", applicationToken,
                    "number", numbers,
                    "text", message
                );
                
                String jsonInputString = objectMapper.writeValueAsString(requestBody);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                StringBuilder response = new StringBuilder();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(responseCode >= 200 && responseCode < 300 ? conn.getInputStream() : conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                }
                
                log.info("Bulk SMS enviado a {} destinatarios", recipients.size());
                if (responseCode >= 200 && responseCode < 300) {
                    return new SmsResponse(true, response.toString(), null);
                } else {
                    return new SmsResponse(false, null, "HTTP Error " + responseCode + ": " + response.toString());
                }
                
            } catch (Exception e) {
                log.error("Error enviando bulk SMS: {}", e.getMessage());
                return new SmsResponse(false, null, e.getMessage());
            }
        });
    }
    
    public CompletableFuture<SmsResponse> sendSurveyInvitation(
            String to, String recipientName, String surveyTitle, String surveyUrl) {
        String message = String.format(
                "Hola %s! Te invitamos a completar la encuesta \"%s\". Accede aqui: %s",
                recipientName != null ? recipientName : "",
                surveyTitle,
                surveyUrl
        );
        
        if (message.length() > 160) {
            message = String.format(
                    "Te invitamos a completar nuestra encuesta. Accede aqui: %s",
                    surveyUrl
            );
        }
        
        return sendSms(to, message);
    }
    
    private String normalizePhoneNumber(String phone) {
        // Remove spaces, dashes, parentheses
        String normalized = phone.replaceAll("[\\s\\-\\(\\)]", "");
        // Remove + prefix if present (BulkGate prefers without +)
        if (normalized.startsWith("+")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }
    
    public String getApplicationId() {
        return applicationId;
    }
    
    public String getApplicationToken() {
        return applicationToken;
    }
    
    public record SmsResponse(boolean success, String messageId, String error) {}
}

