package com.calm.admin.service;

import com.calm.admin.model.AdvancedAnalysis;
import com.calm.admin.model.Transcription;
import com.calm.admin.repository.AdvancedAnalysisRepository;
import com.calm.admin.repository.TranscriptionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AdvancedAnalyzerService {
    
    private static final Logger logger = LoggerFactory.getLogger(AdvancedAnalyzerService.class);
    
    private final AdvancedAnalysisRepository advancedAnalysisRepository;
    private final TranscriptionRepository transcriptionRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    private static final String ADVANCED_ANALYSIS_PROMPT = """
        Eres un experto en análisis de conversaciones de venta. Analiza la siguiente transcripción de una interacción presencial en una tienda de colchones y extrae métricas detalladas.
        
        IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin texto adicional.
        
        Analiza y devuelve:
        
        1. CONVERSATION_FLOW: Estima el porcentaje de tiempo dedicado a cada fase (deben sumar 100):
           - apertura: Saludo inicial, presentación
           - descubrimiento: Preguntas sobre necesidades del cliente
           - objecion: Momentos donde el cliente expresa dudas o resistencia
           - argumento: Vendedor explicando beneficios, características
           - cierre: Intento de cerrar la venta, negociación final
           - silencio: Pausas, silencios, momentos sin interacción clara
        
        2. CUSTOMER_CONFIDENCE: Score 0-100 del nivel de confianza/interés del cliente durante la conversación.
           Considera: tono, preguntas del cliente, engagement, respuestas positivas.
        
        3. VENDOR_METRICS: Evalúa al vendedor (cada uno 0-100):
           - vendorTalkPercent: % estimado del tiempo que habla el vendedor vs cliente
           - activeListening: Qué tan bien escucha y responde a las necesidades
           - objectionHandling: Cómo maneja las objeciones del cliente
           - closingRhythm: Timing y efectividad en el intento de cierre
           - empathy: Nivel de empatía y conexión con el cliente
        
        4. OBJECTIONS: Cuenta las objeciones por tipo:
           - explicit: Objeciones claras ("es muy caro", "no me convence")
           - implicit: Objeciones indirectas ("voy a pensarlo", "después veo")
           - unanswered: Objeciones que el vendedor ignoró
           - ineffective: Objeciones respondidas pero sin convencer al cliente
        
        5. LOSS_MOMENT (solo si NO hubo venta):
           - keyPhrase: La frase más relevante del cliente antes de decidir no comprar
           - abandonMinute: Minuto aproximado donde se perdió el interés (estimar basado en el flujo)
        
        Formato de respuesta JSON:
        {
            "conversationFlow": {
                "apertura": <int 0-100>,
                "descubrimiento": <int 0-100>,
                "objecion": <int 0-100>,
                "argumento": <int 0-100>,
                "cierre": <int 0-100>,
                "silencio": <int 0-100>
            },
            "customerConfidence": <int 0-100>,
            "vendorMetrics": {
                "vendorTalkPercent": <int 0-100>,
                "activeListening": <int 0-100>,
                "objectionHandling": <int 0-100>,
                "closingRhythm": <int 0-100>,
                "empathy": <int 0-100>
            },
            "objections": {
                "explicit": <int>,
                "implicit": <int>,
                "unanswered": <int>,
                "ineffective": <int>
            },
            "lossMonent": {
                "keyPhrase": "<string o null si hubo venta>",
                "abandonMinute": <int o null si hubo venta>
            }
        }
        
        TRANSCRIPCIÓN A ANALIZAR:
        """;
    
    public AdvancedAnalyzerService(
            AdvancedAnalysisRepository advancedAnalysisRepository,
            TranscriptionRepository transcriptionRepository,
            ObjectMapper objectMapper) {
        this.advancedAnalysisRepository = advancedAnalysisRepository;
        this.transcriptionRepository = transcriptionRepository;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Analiza una transcripción individual con el prompt avanzado
     */
    public AdvancedAnalysis analyzeTranscription(Transcription transcription) {
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("OpenAI API key not configured");
            return null;
        }
        
        try {
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(120));
            
            String fullPrompt = ADVANCED_ANALYSIS_PROMPT + "\n\n" + transcription.getTranscriptionText();
            
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model("gpt-4o-mini")
                    .messages(List.of(
                            new ChatMessage("system", "Eres un analista experto en conversaciones de venta. Responde solo con JSON válido."),
                            new ChatMessage("user", fullPrompt)
                    ))
                    .temperature(0.3)
                    .maxTokens(1000)
                    .build();
            
            String response = service.createChatCompletion(request)
                    .getChoices().get(0).getMessage().getContent();
            
            logger.info("Advanced analysis response received for {}", transcription.getRecordingId());
            
            return parseAndSaveAnalysis(transcription.getRecordingId(), response);
            
        } catch (Exception e) {
            logger.error("Error in advanced analysis for {}: {}", transcription.getRecordingId(), e.getMessage());
            return null;
        }
    }
    
    /**
     * Parsea la respuesta de GPT y guarda en la base de datos
     */
    private AdvancedAnalysis parseAndSaveAnalysis(String recordingId, String jsonResponse) {
        try {
            // Limpiar respuesta
            String cleanJson = jsonResponse.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();
            
            JsonNode root = objectMapper.readTree(cleanJson);
            
            AdvancedAnalysis analysis = advancedAnalysisRepository.findByRecordingId(recordingId)
                    .orElse(new AdvancedAnalysis(recordingId));
            
            // Conversation Flow
            JsonNode flow = root.get("conversationFlow");
            if (flow != null) {
                analysis.setAperturaPercent(getIntValue(flow, "apertura", 0));
                analysis.setDescubrimientoPercent(getIntValue(flow, "descubrimiento", 0));
                analysis.setObjecionPercent(getIntValue(flow, "objecion", 0));
                analysis.setArgumentoPercent(getIntValue(flow, "argumento", 0));
                analysis.setCierrePercent(getIntValue(flow, "cierre", 0));
                analysis.setSilencioPercent(getIntValue(flow, "silencio", 0));
            }
            
            // Customer Confidence
            analysis.setCustomerConfidenceScore(getIntValue(root, "customerConfidence", 50));
            
            // Vendor Metrics
            JsonNode vendor = root.get("vendorMetrics");
            if (vendor != null) {
                analysis.setVendorTalkPercent(getIntValue(vendor, "vendorTalkPercent", 50));
                analysis.setActiveListeningScore(getIntValue(vendor, "activeListening", 50));
                analysis.setObjectionHandlingScore(getIntValue(vendor, "objectionHandling", 50));
                analysis.setClosingRhythmScore(getIntValue(vendor, "closingRhythm", 50));
                analysis.setEmpathyScore(getIntValue(vendor, "empathy", 50));
            }
            
            // Objections
            JsonNode objections = root.get("objections");
            if (objections != null) {
                analysis.setExplicitObjections(getIntValue(objections, "explicit", 0));
                analysis.setImplicitObjections(getIntValue(objections, "implicit", 0));
                analysis.setUnansweredObjections(getIntValue(objections, "unanswered", 0));
                analysis.setIneffectiveResponses(getIntValue(objections, "ineffective", 0));
            }
            
            // Loss Moment
            JsonNode loss = root.get("lossMonent");
            if (loss != null && !loss.isNull()) {
                if (loss.has("keyPhrase") && !loss.get("keyPhrase").isNull()) {
                    analysis.setKeyAbandonPhrase(loss.get("keyPhrase").asText());
                }
                if (loss.has("abandonMinute") && !loss.get("abandonMinute").isNull()) {
                    analysis.setAbandonMinute(loss.get("abandonMinute").asInt());
                }
            }
            
            analysis.setAnalyzedAt(LocalDateTime.now());
            analysis.setRawAnalysisJson(cleanJson);
            
            return advancedAnalysisRepository.save(analysis);
            
        } catch (Exception e) {
            logger.error("Error parsing advanced analysis for {}: {}", recordingId, e.getMessage());
            return null;
        }
    }
    
    private int getIntValue(JsonNode node, String field, int defaultValue) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asInt(defaultValue);
        }
        return defaultValue;
    }
    
    /**
     * Ejecuta análisis avanzado en batch con SSE para progreso
     */
    public SseEmitter runAdvancedAnalysisWithProgress() {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutos
        ExecutorService executor = Executors.newSingleThreadExecutor();
        
        executor.execute(() -> {
            try {
                // Obtener transcripciones que no tienen análisis avanzado
                List<Transcription> allTranscriptions = transcriptionRepository.findAll();
                List<String> analyzedIds = advancedAnalysisRepository.findAll()
                        .stream().map(AdvancedAnalysis::getRecordingId).toList();
                
                List<Transcription> toAnalyze = allTranscriptions.stream()
                        .filter(t -> !analyzedIds.contains(t.getRecordingId()))
                        .filter(t -> t.getTranscriptionText() != null && !t.getTranscriptionText().isEmpty())
                        .toList();
                
                int total = toAnalyze.size();
                int current = 0;
                int success = 0;
                
                sendEvent(emitter, "start", null, "Iniciando análisis avanzado de " + total + " transcripciones", 0, total);
                
                for (Transcription transcription : toAnalyze) {
                    current++;
                    
                    sendEvent(emitter, "progress", transcription.getRecordingId(), 
                            "Analizando: " + transcription.getUserName(), current, total);
                    
                    AdvancedAnalysis result = analyzeTranscription(transcription);
                    if (result != null) {
                        success++;
                    }
                    
                    // Pequeña pausa para no saturar la API
                    Thread.sleep(500);
                }
                
                // Resultado final
                Map<String, Object> result = new HashMap<>();
                result.put("total", total);
                result.put("success", success);
                result.put("failed", total - success);
                
                sendEvent(emitter, "complete", null, "Análisis completado", total, total);
                
                emitter.send(SseEmitter.event()
                        .name("result")
                        .data(objectMapper.writeValueAsString(result)));
                
                emitter.complete();
                
            } catch (Exception e) {
                logger.error("Error in batch advanced analysis: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"error\": \"" + e.getMessage() + "\"}"));
                    emitter.complete();
                } catch (IOException ignored) {}
            } finally {
                executor.shutdown();
            }
        });
        
        return emitter;
    }
    
    private void sendEvent(SseEmitter emitter, String type, String id, String message, int current, int total) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("type", type);
            data.put("id", id);
            data.put("message", message);
            data.put("current", current);
            data.put("total", total);
            data.put("percent", total > 0 ? (current * 100 / total) : 0);
            
            emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(objectMapper.writeValueAsString(data)));
        } catch (IOException e) {
            logger.warn("Error sending SSE event: {}", e.getMessage());
        }
    }
    
    /**
     * Obtiene métricas agregadas para el dashboard de recomendaciones
     */
    public Map<String, Object> getAggregatedMetrics() {
        List<AdvancedAnalysis> analyses = advancedAnalysisRepository.findAll();
        List<Transcription> transcriptions = transcriptionRepository.findAll();
        
        Map<String, Object> metrics = new HashMap<>();
        
        if (analyses.isEmpty()) {
            metrics.put("hasData", false);
            metrics.put("analyzedCount", 0);
            metrics.put("totalCount", transcriptions.size());
            return metrics;
        }
        
        metrics.put("hasData", true);
        metrics.put("analyzedCount", analyses.size());
        metrics.put("totalCount", transcriptions.size());
        
        // Promedios generales de Conversation Flow
        Map<String, Double> avgFlow = new HashMap<>();
        avgFlow.put("apertura", analyses.stream().mapToInt(a -> a.getAperturaPercent() != null ? a.getAperturaPercent() : 0).average().orElse(0));
        avgFlow.put("descubrimiento", analyses.stream().mapToInt(a -> a.getDescubrimientoPercent() != null ? a.getDescubrimientoPercent() : 0).average().orElse(0));
        avgFlow.put("objecion", analyses.stream().mapToInt(a -> a.getObjecionPercent() != null ? a.getObjecionPercent() : 0).average().orElse(0));
        avgFlow.put("argumento", analyses.stream().mapToInt(a -> a.getArgumentoPercent() != null ? a.getArgumentoPercent() : 0).average().orElse(0));
        avgFlow.put("cierre", analyses.stream().mapToInt(a -> a.getCierrePercent() != null ? a.getCierrePercent() : 0).average().orElse(0));
        avgFlow.put("silencio", analyses.stream().mapToInt(a -> a.getSilencioPercent() != null ? a.getSilencioPercent() : 0).average().orElse(0));
        metrics.put("avgConversationFlow", avgFlow);
        
        // Customer Confidence promedio
        metrics.put("avgCustomerConfidence", analyses.stream()
                .mapToInt(a -> a.getCustomerConfidenceScore() != null ? a.getCustomerConfidenceScore() : 0)
                .average().orElse(0));
        
        // Customer Confidence por sucursal - usar branchName
        Map<String, String> recordingToBranch = new HashMap<>();
        for (Transcription t : transcriptions) {
            String branchName = t.getBranchName() != null ? t.getBranchName() : "desconocido";
            recordingToBranch.put(t.getRecordingId(), branchName);
        }
        
        Map<String, List<AdvancedAnalysis>> byBranch = analyses.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> recordingToBranch.getOrDefault(a.getRecordingId(), "desconocido")
                ));
        
        List<Map<String, Object>> confidenceByBranch = byBranch.entrySet().stream()
                .map(e -> {
                    Map<String, Object> branchData = new HashMap<>();
                    branchData.put("branchName", e.getKey());
                    branchData.put("avgConfidence", e.getValue().stream()
                            .mapToInt(a -> a.getCustomerConfidenceScore() != null ? a.getCustomerConfidenceScore() : 0)
                            .average().orElse(0));
                    branchData.put("count", e.getValue().size());
                    return branchData;
                })
                .sorted((a, b) -> Double.compare((double) b.get("avgConfidence"), (double) a.get("avgConfidence")))
                .toList();
        metrics.put("confidenceByBranch", confidenceByBranch);
        
        // Vendor Metrics promedio
        Map<String, Double> avgVendor = new HashMap<>();
        avgVendor.put("vendorTalkPercent", analyses.stream().mapToInt(a -> a.getVendorTalkPercent() != null ? a.getVendorTalkPercent() : 50).average().orElse(50));
        avgVendor.put("activeListening", analyses.stream().mapToInt(a -> a.getActiveListeningScore() != null ? a.getActiveListeningScore() : 50).average().orElse(50));
        avgVendor.put("objectionHandling", analyses.stream().mapToInt(a -> a.getObjectionHandlingScore() != null ? a.getObjectionHandlingScore() : 50).average().orElse(50));
        avgVendor.put("closingRhythm", analyses.stream().mapToInt(a -> a.getClosingRhythmScore() != null ? a.getClosingRhythmScore() : 50).average().orElse(50));
        avgVendor.put("empathy", analyses.stream().mapToInt(a -> a.getEmpathyScore() != null ? a.getEmpathyScore() : 50).average().orElse(50));
        metrics.put("avgVendorMetrics", avgVendor);
        
        // Total de objeciones por tipo
        Map<String, Integer> totalObjections = new HashMap<>();
        totalObjections.put("explicit", analyses.stream().mapToInt(a -> a.getExplicitObjections() != null ? a.getExplicitObjections() : 0).sum());
        totalObjections.put("implicit", analyses.stream().mapToInt(a -> a.getImplicitObjections() != null ? a.getImplicitObjections() : 0).sum());
        totalObjections.put("unanswered", analyses.stream().mapToInt(a -> a.getUnansweredObjections() != null ? a.getUnansweredObjections() : 0).sum());
        totalObjections.put("ineffective", analyses.stream().mapToInt(a -> a.getIneffectiveResponses() != null ? a.getIneffectiveResponses() : 0).sum());
        metrics.put("totalObjections", totalObjections);
        
        // Top Loss Moments (frases más comunes) - normalizar para agrupar similares
        Map<String, List<AdvancedAnalysis>> phraseGroups = analyses.stream()
                .filter(a -> a.getKeyAbandonPhrase() != null && !a.getKeyAbandonPhrase().isEmpty())
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getKeyAbandonPhrase().toLowerCase().trim()
                ));
        
        List<Map<String, Object>> lossMoments = phraseGroups.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> moment = new HashMap<>();
                    // Usar la frase original del primer elemento (con capitalización original)
                    moment.put("phrase", e.getValue().get(0).getKeyAbandonPhrase());
                    moment.put("count", e.getValue().size());
                    // Calcular minuto promedio específico para esta frase
                    double avgMin = e.getValue().stream()
                            .filter(a -> a.getAbandonMinute() != null)
                            .mapToInt(AdvancedAnalysis::getAbandonMinute)
                            .average().orElse(0);
                    moment.put("avgMinute", Math.round(avgMin * 10.0) / 10.0);
                    return moment;
                })
                .toList();
        metrics.put("topLossMoments", lossMoments);
        
        // Minuto promedio de abandono general
        metrics.put("avgAbandonMinute", Math.round(analyses.stream()
                .filter(a -> a.getAbandonMinute() != null)
                .mapToInt(AdvancedAnalysis::getAbandonMinute)
                .average().orElse(0) * 10.0) / 10.0);
        
        return metrics;
    }
    
    /**
     * Obtiene análisis por vendedor con datos separados por venta/no venta
     */
    public List<Map<String, Object>> getMetricsByVendor() {
        List<AdvancedAnalysis> analyses = advancedAnalysisRepository.findAll();
        List<Transcription> transcriptions = transcriptionRepository.findAll();
        
        // Crear mapas de recordingId -> datos de transcripción
        Map<String, String> recordingToUser = new HashMap<>();
        Map<String, Boolean> recordingToSale = new HashMap<>();
        
        for (Transcription t : transcriptions) {
            recordingToUser.put(t.getRecordingId(), t.getUserName() != null ? t.getUserName() : "Desconocido");
            recordingToSale.put(t.getRecordingId(), Boolean.TRUE.equals(t.getSaleCompleted()));
        }
        
        // Agrupar análisis por vendedor
        Map<String, List<AdvancedAnalysis>> byVendor = analyses.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> recordingToUser.getOrDefault(a.getRecordingId(), "Desconocido")
                ));
        
        return byVendor.entrySet().stream()
                .map(e -> {
                    String vendor = e.getKey();
                    List<AdvancedAnalysis> vendorAnalyses = e.getValue();
                    
                    // Separar por venta/no venta
                    List<AdvancedAnalysis> withSale = vendorAnalyses.stream()
                            .filter(a -> Boolean.TRUE.equals(recordingToSale.get(a.getRecordingId())))
                            .toList();
                    List<AdvancedAnalysis> withoutSale = vendorAnalyses.stream()
                            .filter(a -> !Boolean.TRUE.equals(recordingToSale.get(a.getRecordingId())))
                            .toList();
                    
                    Map<String, Object> vendorMetrics = new HashMap<>();
                    vendorMetrics.put("userName", vendor);
                    vendorMetrics.put("count", vendorAnalyses.size());
                    
                    // Promedios generales
                    vendorMetrics.put("avgConfidence", vendorAnalyses.stream()
                            .mapToInt(a -> a.getCustomerConfidenceScore() != null ? a.getCustomerConfidenceScore() : 0)
                            .average().orElse(0));
                    
                    // Confidence separado por venta/no venta
                    vendorMetrics.put("avgConfidenceWithSale", withSale.stream()
                            .mapToInt(a -> a.getCustomerConfidenceScore() != null ? a.getCustomerConfidenceScore() : 0)
                            .average().orElse(0));
                    vendorMetrics.put("avgConfidenceWithoutSale", withoutSale.stream()
                            .mapToInt(a -> a.getCustomerConfidenceScore() != null ? a.getCustomerConfidenceScore() : 0)
                            .average().orElse(0));
                    
                    vendorMetrics.put("avgActiveListening", vendorAnalyses.stream()
                            .mapToInt(a -> a.getActiveListeningScore() != null ? a.getActiveListeningScore() : 0)
                            .average().orElse(0));
                    vendorMetrics.put("avgObjectionHandling", vendorAnalyses.stream()
                            .mapToInt(a -> a.getObjectionHandlingScore() != null ? a.getObjectionHandlingScore() : 0)
                            .average().orElse(0));
                    vendorMetrics.put("avgClosingRhythm", vendorAnalyses.stream()
                            .mapToInt(a -> a.getClosingRhythmScore() != null ? a.getClosingRhythmScore() : 0)
                            .average().orElse(0));
                    vendorMetrics.put("avgEmpathy", vendorAnalyses.stream()
                            .mapToInt(a -> a.getEmpathyScore() != null ? a.getEmpathyScore() : 0)
                            .average().orElse(0));
                    
                    // Conversation Flow promedio
                    Map<String, Double> flow = new HashMap<>();
                    flow.put("apertura", vendorAnalyses.stream().mapToInt(a -> a.getAperturaPercent() != null ? a.getAperturaPercent() : 0).average().orElse(0));
                    flow.put("descubrimiento", vendorAnalyses.stream().mapToInt(a -> a.getDescubrimientoPercent() != null ? a.getDescubrimientoPercent() : 0).average().orElse(0));
                    flow.put("objecion", vendorAnalyses.stream().mapToInt(a -> a.getObjecionPercent() != null ? a.getObjecionPercent() : 0).average().orElse(0));
                    flow.put("argumento", vendorAnalyses.stream().mapToInt(a -> a.getArgumentoPercent() != null ? a.getArgumentoPercent() : 0).average().orElse(0));
                    flow.put("cierre", vendorAnalyses.stream().mapToInt(a -> a.getCierrePercent() != null ? a.getCierrePercent() : 0).average().orElse(0));
                    flow.put("silencio", vendorAnalyses.stream().mapToInt(a -> a.getSilencioPercent() != null ? a.getSilencioPercent() : 0).average().orElse(0));
                    vendorMetrics.put("conversationFlow", flow);
                    
                    return vendorMetrics;
                })
                .sorted((a, b) -> Integer.compare((int) b.get("count"), (int) a.get("count")))
                .toList();
    }
    
    /**
     * Obtiene lista de transcripciones sin análisis avanzado
     */
    public List<Map<String, Object>> getMissingAnalyses() {
        List<Transcription> allTranscriptions = transcriptionRepository.findAll();
        List<String> analyzedIds = advancedAnalysisRepository.findAll()
                .stream().map(AdvancedAnalysis::getRecordingId).toList();
        
        return allTranscriptions.stream()
                .filter(t -> !analyzedIds.contains(t.getRecordingId()))
                .map(t -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("recordingId", t.getRecordingId());
                    info.put("userName", t.getUserName());
                    info.put("hasText", t.getTranscriptionText() != null && !t.getTranscriptionText().isEmpty());
                    info.put("textLength", t.getTranscriptionText() != null ? t.getTranscriptionText().length() : 0);
                    return info;
                })
                .toList();
    }
    
    /**
     * Reintenta análisis de transcripciones faltantes (incluye las que tienen texto vacío)
     */
    public SseEmitter retryMissingAnalyses() {
        SseEmitter emitter = new SseEmitter(600000L);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        
        executor.execute(() -> {
            try {
                List<Transcription> allTranscriptions = transcriptionRepository.findAll();
                List<String> analyzedIds = advancedAnalysisRepository.findAll()
                        .stream().map(AdvancedAnalysis::getRecordingId).toList();
                
                List<Transcription> missing = allTranscriptions.stream()
                        .filter(t -> !analyzedIds.contains(t.getRecordingId()))
                        .filter(t -> t.getTranscriptionText() != null && !t.getTranscriptionText().isEmpty())
                        .toList();
                
                int total = missing.size();
                int current = 0;
                int success = 0;
                
                sendEvent(emitter, "start", null, "Reintentando " + total + " transcripciones faltantes", 0, total);
                
                for (Transcription transcription : missing) {
                    current++;
                    sendEvent(emitter, "progress", transcription.getRecordingId(), 
                            "Analizando: " + transcription.getUserName(), current, total);
                    
                    AdvancedAnalysis result = analyzeTranscription(transcription);
                    if (result != null) {
                        success++;
                    }
                    
                    Thread.sleep(500);
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("total", total);
                result.put("success", success);
                result.put("failed", total - success);
                
                sendEvent(emitter, "complete", null, "Reintento completado", total, total);
                
                emitter.send(SseEmitter.event()
                        .name("result")
                        .data(objectMapper.writeValueAsString(result)));
                
                emitter.complete();
                
            } catch (Exception e) {
                logger.error("Error retrying missing analyses: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"error\": \"" + e.getMessage() + "\"}"));
                    emitter.complete();
                } catch (IOException ignored) {}
            } finally {
                executor.shutdown();
            }
        });
        
        return emitter;
    }
    
    /**
     * Borra todos los análisis avanzados para poder re-ejecutar
     */
    public long clearAllAnalyses() {
        long count = advancedAnalysisRepository.count();
        advancedAnalysisRepository.deleteAll();
        logger.info("Deleted {} advanced analyses", count);
        return count;
    }
}
