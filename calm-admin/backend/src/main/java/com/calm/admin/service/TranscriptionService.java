package com.calm.admin.service;

import com.calm.admin.dto.DashboardMetricsDTO;
import com.calm.admin.dto.FilterDTO;
import com.calm.admin.dto.SearchResultDTO;
import com.calm.admin.dto.TranscriptionDTO;
import com.calm.admin.model.AnalysisResult;
import com.calm.admin.model.Transcription;
import com.calm.admin.repository.AdvancedAnalysisRepository;
import com.calm.admin.repository.TranscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class TranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);

    private final TranscriptionRepository repository;
    private final AdvancedAnalysisRepository advancedAnalysisRepository;
    private final S3Service s3Service;
    private final ChatGPTAnalyzerService analyzerService;

    public TranscriptionService(TranscriptionRepository repository, 
                                AdvancedAnalysisRepository advancedAnalysisRepository,
                                S3Service s3Service, 
                                ChatGPTAnalyzerService analyzerService) {
        this.repository = repository;
        this.advancedAnalysisRepository = advancedAnalysisRepository;
        this.s3Service = s3Service;
        this.analyzerService = analyzerService;
    }

    @Transactional
    public void syncTranscriptions() {
        log.info("Starting transcription sync from S3...");
        
        List<String> recordingIds = s3Service.listAllRecordingIds();
        int newCount = 0;
        
        for (String recordingId : recordingIds) {
            if (!repository.existsByRecordingId(recordingId)) {
                if (s3Service.transcriptionExists(recordingId)) {
                    try {
                        importTranscription(recordingId);
                        newCount++;
                    } catch (Exception e) {
                        log.error("Error importing transcription {}: {}", recordingId, e.getMessage());
                    }
                }
            }
        }
        
        log.info("Sync completed. Imported {} new transcriptions", newCount);
    }

    @Transactional
    public Transcription importTranscription(String recordingId) {
        Map<String, Object> metadata = s3Service.getMetadata(recordingId);
        String transcriptionText = s3Service.getTranscription(recordingId);
        
        if (transcriptionText == null || transcriptionText.isEmpty()) {
            log.warn("No transcription text found for recording {}", recordingId);
            return null;
        }
        
        // Obtener la fecha del archivo en S3 (cuando se creó la grabación)
        java.time.Instant s3Date = s3Service.getTranscriptionDate(recordingId);
        LocalDateTime recordingDate = s3Date != null 
            ? LocalDateTime.ofInstant(s3Date, java.time.ZoneId.systemDefault())
            : LocalDateTime.now();
        
        // Obtener valores de metadata
        String userName = metadata.get("userName") != null ? (String) metadata.get("userName") : "Desconocido";
        String branchName = metadata.get("branchName") != null ? (String) metadata.get("branchName") : "Desconocida";
        
        // Mapeo de nombres (hardcoded)
        userName = mapUserName(userName);
        branchName = mapBranchName(branchName);
        
        Transcription transcription = new Transcription();
        transcription.setRecordingId(recordingId);
        transcription.setUserId(metadata.get("userId") != null ? (Long) metadata.get("userId") : null);
        transcription.setUserName(userName);
        transcription.setBranchId(metadata.get("branchId") != null ? (Long) metadata.get("branchId") : null);
        transcription.setBranchName(branchName);
        transcription.setTranscriptionText(transcriptionText);
        transcription.setRecordingDate(recordingDate);
        transcription.setAnalyzed(false);
        
        return repository.save(transcription);
    }

    @Transactional
    public void analyzeUnprocessedTranscriptions() {
        List<Transcription> unanalyzed = repository.findByAnalyzedFalse();
        log.info("Found {} unanalyzed transcriptions", unanalyzed.size());
        
        for (Transcription transcription : unanalyzed) {
            try {
                analyzeTranscription(transcription.getRecordingId());
            } catch (Exception e) {
                log.error("Error analyzing transcription {}: {}", transcription.getRecordingId(), e.getMessage());
            }
        }
    }

    @Transactional
    public TranscriptionDTO analyzeTranscription(String recordingId) {
        Transcription transcription = repository.findById(recordingId)
                .orElseThrow(() -> new RuntimeException("Transcription not found: " + recordingId));
        
        if (transcription.getTranscriptionText() == null || transcription.getTranscriptionText().isEmpty()) {
            throw new RuntimeException("No transcription text available for analysis");
        }
        
        AnalysisResult analysis = analyzerService.analyzeTranscription(
                transcription.getTranscriptionText(),
                transcription.getUserName(),
                transcription.getBranchName()
        );
        
        transcription.setSaleCompleted(analysis.isSaleCompleted());
        transcription.setSaleStatus(analysis.getSaleStatus());
        transcription.setAnalysisConfidence(analysis.getAnalysisConfidence());
        transcription.setConfidenceTrace(analysis.getConfidenceTrace());
        transcription.setSaleEvidence(analysis.getSaleEvidence());
        transcription.setSaleEvidenceMeta(analysis.getSaleEvidenceMeta());
        transcription.setNoSaleReason(analysis.getNoSaleReason());
        transcription.setProductsDiscussed(String.join(", ", analysis.getProductsDiscussed()));
        transcription.setCustomerObjections(String.join(", ", analysis.getCustomerObjections()));
        transcription.setImprovementSuggestions(String.join(", ", analysis.getImprovementSuggestions()));
        transcription.setExecutiveSummary(analysis.getExecutiveSummary());
        transcription.setSellerScore(analysis.getSellerScore());
        transcription.setSellerStrengths(String.join(", ", analysis.getSellerStrengths()));
        transcription.setSellerWeaknesses(String.join(", ", analysis.getSellerWeaknesses()));
        transcription.setAnalyzed(true);
        transcription.setAnalyzedAt(LocalDateTime.now());
        
        repository.save(transcription);
        log.info("Analysis completed for transcription {}", recordingId);
        
        return toDTO(transcription);
    }

    public List<TranscriptionDTO> getTranscriptions(FilterDTO filter) {
        List<Transcription> transcriptions;
        
        if (filter != null && hasAnyFilter(filter)) {
            transcriptions = repository.findWithFilters(
                    filter.getUserId(),
                    filter.getBranchId(),
                    filter.getSaleCompleted(),
                    filter.getDateFrom() != null ? filter.getDateFrom().atStartOfDay() : null,
                    filter.getDateTo() != null ? filter.getDateTo().atTime(23, 59, 59) : null,
                    filter.getMinScore(),
                    filter.getMaxScore()
            );
        } else {
            transcriptions = repository.findAll();
        }
        
        return transcriptions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TranscriptionDTO getTranscription(String recordingId) {
        return repository.findById(recordingId)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Transcription not found: " + recordingId));
    }

    public DashboardMetricsDTO getDashboardMetrics() {
        long total = repository.count();
        long analyzed = repository.countAnalyzed();
        long pendingAnalysis = repository.countPendingAnalysis();
        long sales = repository.countSales();
        long noSales = repository.countNoSales();
        Double avgScore = repository.averageSellerScore();
        
        List<DashboardMetricsDTO.SellerMetrics> sellerMetrics = repository.getSellerStats().stream()
                .map(row -> {
                    DashboardMetricsDTO.SellerMetrics sm = new DashboardMetricsDTO.SellerMetrics();
                    sm.setUserId((Long) row[0]);
                    sm.setUserName((String) row[1]);
                    sm.setBranchName((String) row[2]);
                    sm.setTotalInteractions(((Number) row[3]).longValue());
                    sm.setSales(((Number) row[4]).longValue());
                    sm.setNoSales(((Number) row[5]).longValue()); // Ahora viene directo de la query
                    sm.setConversionRate(calculateRate(((Number) row[4]).longValue(), ((Number) row[3]).longValue()));
                    sm.setAverageScore(row[6] != null ? ((Number) row[6]).doubleValue() : 0.0);
                    return sm;
                })
                .sorted((a, b) -> Double.compare(b.getConversionRate(), a.getConversionRate()))
                .collect(Collectors.toList());
        
        List<DashboardMetricsDTO.BranchMetrics> branchMetrics = repository.getBranchStats().stream()
                .map(row -> {
                    DashboardMetricsDTO.BranchMetrics bm = new DashboardMetricsDTO.BranchMetrics();
                    bm.setBranchId((Long) row[0]);
                    bm.setBranchName((String) row[1]);
                    bm.setTotalInteractions(((Number) row[2]).longValue());
                    bm.setSales(((Number) row[3]).longValue());
                    bm.setNoSales(((Number) row[4]).longValue()); // Ahora viene directo de la query
                    bm.setConversionRate(calculateRate(((Number) row[3]).longValue(), ((Number) row[2]).longValue()));
                    bm.setAverageScore(row[5] != null ? ((Number) row[5]).doubleValue() : 0.0);
                    return bm;
                })
                .sorted((a, b) -> Double.compare(b.getConversionRate(), a.getConversionRate()))
                .collect(Collectors.toList());
        
        Map<String, Long> noSaleReasons = repository.countByNoSaleReason().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).longValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
        
        DashboardMetricsDTO metrics = new DashboardMetricsDTO();
        metrics.setTotalTranscriptions(total);
        metrics.setAnalyzedTranscriptions(analyzed);
        metrics.setPendingAnalysis(pendingAnalysis);
        metrics.setTotalSales(sales);
        metrics.setTotalNoSales(noSales);
        // Conversión basada en ANALIZADAS, no en total
        metrics.setConversionRate(calculateRate(sales, analyzed));
        metrics.setAverageSellerScore(avgScore != null ? avgScore : 0.0);
        metrics.setSellerMetrics(sellerMetrics);
        metrics.setBranchMetrics(branchMetrics);
        metrics.setNoSaleReasons(noSaleReasons);
        
        return metrics;
    }

    public List<Map<String, Object>> getSellers() {
        return repository.findAllSellers().stream()
                .map(row -> {
                    Map<String, Object> seller = new HashMap<>();
                    seller.put("id", row[0]);
                    seller.put("name", row[1]);
                    return seller;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getBranches() {
        return repository.findAllBranches().stream()
                .map(row -> {
                    Map<String, Object> branch = new HashMap<>();
                    branch.put("id", row[0]);
                    branch.put("name", row[1]);
                    return branch;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> forceSync() {
        long beforeCount = repository.count();
        syncTranscriptions();
        long afterCount = repository.count();
        long imported = afterCount - beforeCount;
        
        // Analyze unprocessed transcriptions
        log.info("Starting analysis of unprocessed transcriptions...");
        analyzeUnprocessedTranscriptions();
        
        Map<String, Object> result = new HashMap<>();
        result.put("previousCount", beforeCount);
        result.put("newCount", afterCount);
        result.put("imported", imported);
        result.put("timestamp", LocalDateTime.now());
        
        return result;
    }

    /**
     * Sync with Server-Sent Events for real-time progress updates.
     */
    public SseEmitter forceSyncWithProgress() {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutes timeout
        ExecutorService executor = Executors.newSingleThreadExecutor();

        executor.execute(() -> {
            try {
                // Phase 1: Import from S3
                sendEvent(emitter, "phase", "import", "Importando desde S3...", 0, 0);
                
                long beforeCount = repository.count();
                List<String> recordingIds = s3Service.listAllRecordingIds();
                int totalToImport = 0;
                
                // Count new ones first
                List<String> newIds = new ArrayList<>();
                for (String recordingId : recordingIds) {
                    if (!repository.existsByRecordingId(recordingId) && s3Service.transcriptionExists(recordingId)) {
                        newIds.add(recordingId);
                    }
                }
                totalToImport = newIds.size();
                
                sendEvent(emitter, "import_start", null, "Importando " + totalToImport + " transcripciones...", 0, totalToImport);
                
                int importedCount = 0;
                for (String recordingId : newIds) {
                    try {
                        importTranscription(recordingId);
                        importedCount++;
                        sendEvent(emitter, "import_progress", recordingId, "Importando...", importedCount, totalToImport);
                    } catch (Exception e) {
                        log.error("Error importing {}: {}", recordingId, e.getMessage());
                    }
                }
                
                sendEvent(emitter, "import_complete", null, "Importación completada: " + importedCount, importedCount, totalToImport);
                
                // Phase 2: Analyze
                List<Transcription> unanalyzed = repository.findByAnalyzedFalse();
                int totalToAnalyze = unanalyzed.size();
                
                sendEvent(emitter, "analyze_start", null, "Analizando " + totalToAnalyze + " transcripciones...", 0, totalToAnalyze);
                
                int analyzedCount = 0;
                for (Transcription transcription : unanalyzed) {
                    try {
                        analyzeTranscription(transcription.getRecordingId());
                        analyzedCount++;
                        sendEvent(emitter, "analyze_progress", transcription.getRecordingId(), 
                                "Analizando: " + transcription.getUserName(), analyzedCount, totalToAnalyze);
                    } catch (Exception e) {
                        log.error("Error analyzing {}: {}", transcription.getRecordingId(), e.getMessage());
                    }
                }
                
                // Complete
                Map<String, Object> result = new HashMap<>();
                result.put("imported", importedCount);
                result.put("analyzed", analyzedCount);
                result.put("timestamp", LocalDateTime.now().toString());
                
                sendEvent(emitter, "complete", null, "Sincronización completada", analyzedCount, totalToAnalyze);
                emitter.send(SseEmitter.event().name("result").data(result));
                emitter.complete();
                
            } catch (Exception e) {
                log.error("Error during sync with progress: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.completeWithError(e);
                } catch (IOException ignored) {}
            } finally {
                executor.shutdown();
            }
        });

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);
        
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
            data.put("percent", total > 0 ? Math.round((current * 100.0) / total) : 0);
            emitter.send(SseEmitter.event().name("progress").data(data));
        } catch (IOException e) {
            log.warn("Failed to send SSE event: {}", e.getMessage());
        }
    }
    
    /**
     * Re-analiza solo las transcripciones marcadas como "no venta".
     * Útil para corregir posibles errores de detección después de mejorar el prompt.
     */
    @Transactional
    public Map<String, Object> reanalyzeNoSales() {
        List<Transcription> noSales = repository.findAnalyzedNoSales();
        log.info("🔄 Re-analizando {} transcripciones marcadas como 'no venta'...", noSales.size());
        
        int reanalyzed = 0;
        int corrected = 0;
        
        for (Transcription transcription : noSales) {
            try {
                boolean wasSale = transcription.getSaleCompleted() != null && transcription.getSaleCompleted();
                
                // Re-analyze
                analyzeTranscription(transcription.getRecordingId());
                reanalyzed++;
                
                // Check if it was corrected
                Transcription updated = repository.findById(transcription.getRecordingId()).orElse(null);
                if (updated != null && updated.getSaleCompleted() != null && updated.getSaleCompleted() && !wasSale) {
                    corrected++;
                    log.info("✅ Corregida: {} - {} (ahora es VENTA)", 
                            transcription.getRecordingId(), transcription.getUserName());
                }
            } catch (Exception e) {
                log.error("Error re-analizando {}: {}", transcription.getRecordingId(), e.getMessage());
            }
        }
        
        log.info("🏁 Re-análisis completado: {} procesadas, {} corregidas a VENTA", reanalyzed, corrected);
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalNoSales", noSales.size());
        result.put("reanalyzed", reanalyzed);
        result.put("correctedToSale", corrected);
        result.put("timestamp", LocalDateTime.now());
        
        return result;
    }
    
    /**
     * Re-analiza TODAS las transcripciones con el prompt actual.
     * Usa SSE para mostrar progreso en tiempo real.
     * Resiliente a desconexiones del cliente - sigue procesando aunque el frontend se desconecte.
     */
    public SseEmitter reanalyzeAllWithProgress() {
        SseEmitter emitter = new SseEmitter(900000L); // 15 minutos timeout
        ExecutorService executor = java.util.concurrent.Executors.newSingleThreadExecutor();
        
        // Track if emitter is still connected
        final boolean[] emitterAlive = {true};
        
        emitter.onCompletion(() -> {
            emitterAlive[0] = false;
            executor.shutdown();
        });
        emitter.onTimeout(() -> {
            emitterAlive[0] = false;
            executor.shutdown();
        });
        emitter.onError((ex) -> {
            emitterAlive[0] = false;
            log.warn("SSE emitter error (client disconnected?): {}", ex.getMessage());
        });
        
        executor.execute(() -> {
            try {
                List<Transcription> all = repository.findAll();
                int total = all.size();
                int current = 0;
                int success = 0;
                int errors = 0;
                
                // Enviar inicio
                safeSend(emitter, emitterAlive, SseEmitter.event()
                        .name("start")
                        .data(Map.of(
                                "message", "Iniciando re-análisis de " + total + " transcripciones",
                                "total", total
                        )));
                
                for (Transcription transcription : all) {
                    current++;
                    
                    try {
                        // Enviar progreso
                        safeSend(emitter, emitterAlive, SseEmitter.event()
                                .name("progress")
                                .data(Map.of(
                                        "current", current,
                                        "total", total,
                                        "recordingId", transcription.getRecordingId(),
                                        "userName", transcription.getUserName() != null ? transcription.getUserName() : "Desconocido",
                                        "message", "Analizando: " + transcription.getRecordingId()
                                )));
                        
                        // Re-analizar directamente (sin pasar por @Transactional proxy)
                        doAnalyzeTranscription(transcription.getRecordingId());
                        success++;
                        
                        log.info("Re-análisis {}/{} OK: {}", current, total, transcription.getRecordingId());
                        
                        // Pequeña pausa para no saturar la API de OpenAI
                        Thread.sleep(500);
                        
                    } catch (Exception e) {
                        errors++;
                        log.error("Error re-analizando {}: {}", transcription.getRecordingId(), e.getMessage(), e);
                        
                        // Enviar progreso con error para esta transcripción
                        safeSend(emitter, emitterAlive, SseEmitter.event()
                                .name("progress")
                                .data(Map.of(
                                        "current", current,
                                        "total", total,
                                        "recordingId", transcription.getRecordingId(),
                                        "userName", transcription.getUserName() != null ? transcription.getUserName() : "Desconocido",
                                        "message", "Error: " + transcription.getRecordingId() + " - " + e.getMessage()
                                )));
                    }
                }
                
                log.info("Re-análisis completado: {} total, {} exitosos, {} errores", total, success, errors);
                
                // Enviar completado
                safeSend(emitter, emitterAlive, SseEmitter.event()
                        .name("complete")
                        .data(Map.of(
                                "message", "Re-análisis completado",
                                "total", total,
                                "success", success,
                                "errors", errors
                        )));
                
                if (emitterAlive[0]) {
                    try { emitter.complete(); } catch (Exception ignored) {}
                }
                
            } catch (Exception e) {
                log.error("Error fatal en re-análisis: {}", e.getMessage(), e);
                if (emitterAlive[0]) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data(Map.of("message", "Error: " + e.getMessage())));
                        emitter.completeWithError(e);
                    } catch (Exception ignored) {}
                }
            } finally {
                executor.shutdown();
            }
        });
        
        return emitter;
    }
    
    /**
     * Safely send SSE event, catching IOException if client disconnected.
     */
    private void safeSend(SseEmitter emitter, boolean[] alive, SseEmitter.SseEventBuilder event) {
        if (!alive[0]) return;
        try {
            emitter.send(event);
        } catch (Exception e) {
            alive[0] = false;
            log.debug("SSE client disconnected, continuing re-analysis in background");
        }
    }
    
    /**
     * Internal method for analyzing a transcription - not @Transactional so it works from background threads.
     */
    private void doAnalyzeTranscription(String recordingId) {
        Transcription transcription = repository.findById(recordingId)
                .orElseThrow(() -> new RuntimeException("Transcription not found: " + recordingId));
        
        if (transcription.getTranscriptionText() == null || transcription.getTranscriptionText().isEmpty()) {
            throw new RuntimeException("No transcription text available for analysis");
        }
        
        AnalysisResult analysis = analyzerService.analyzeTranscription(
                transcription.getTranscriptionText(),
                transcription.getUserName(),
                transcription.getBranchName()
        );
        
        transcription.setSaleCompleted(analysis.isSaleCompleted());
        transcription.setSaleStatus(analysis.getSaleStatus());
        transcription.setAnalysisConfidence(analysis.getAnalysisConfidence());
        transcription.setConfidenceTrace(analysis.getConfidenceTrace());
        transcription.setSaleEvidence(analysis.getSaleEvidence());
        transcription.setSaleEvidenceMeta(analysis.getSaleEvidenceMeta());
        transcription.setNoSaleReason(analysis.getNoSaleReason());
        transcription.setProductsDiscussed(String.join(", ", analysis.getProductsDiscussed()));
        transcription.setCustomerObjections(String.join(", ", analysis.getCustomerObjections()));
        transcription.setImprovementSuggestions(String.join(", ", analysis.getImprovementSuggestions()));
        transcription.setExecutiveSummary(analysis.getExecutiveSummary());
        transcription.setSellerScore(analysis.getSellerScore());
        transcription.setSellerStrengths(String.join(", ", analysis.getSellerStrengths()));
        transcription.setSellerWeaknesses(String.join(", ", analysis.getSellerWeaknesses()));
        transcription.setAnalyzed(true);
        transcription.setAnalyzedAt(LocalDateTime.now());
        
        repository.save(transcription);
    }

    private boolean hasAnyFilter(FilterDTO filter) {
        return filter.getUserId() != null ||
               filter.getBranchId() != null ||
               filter.getSaleCompleted() != null ||
               filter.getDateFrom() != null ||
               filter.getDateTo() != null ||
               filter.getMinScore() != null ||
               filter.getMaxScore() != null;
    }

    private double calculateRate(long numerator, long denominator) {
        if (denominator == 0) return 0.0;
        return Math.round((double) numerator / denominator * 10000) / 100.0;
    }

    private TranscriptionDTO toDTO(Transcription t) {
        TranscriptionDTO dto = new TranscriptionDTO();
        dto.setRecordingId(t.getRecordingId());
        dto.setUserId(t.getUserId());
        dto.setUserName(t.getUserName());
        dto.setBranchId(t.getBranchId());
        dto.setBranchName(t.getBranchName());
        dto.setTranscriptionText(t.getTranscriptionText());
        dto.setSaleCompleted(t.getSaleCompleted());
        dto.setSaleStatus(t.getSaleStatus());
        dto.setAnalysisConfidence(t.getAnalysisConfidence());
        dto.setConfidenceTrace(t.getConfidenceTrace());
        dto.setSaleEvidence(t.getSaleEvidence());
        dto.setSaleEvidenceMeta(t.getSaleEvidenceMeta());
        dto.setNoSaleReason(t.getNoSaleReason());
        dto.setProductsDiscussed(t.getProductsDiscussed() != null 
                ? Arrays.asList(t.getProductsDiscussed().split(", ")) : new ArrayList<>());
        dto.setCustomerObjections(t.getCustomerObjections() != null 
                ? Arrays.asList(t.getCustomerObjections().split(", ")) : new ArrayList<>());
        dto.setImprovementSuggestions(t.getImprovementSuggestions() != null 
                ? Arrays.asList(t.getImprovementSuggestions().split(", ")) : new ArrayList<>());
        dto.setExecutiveSummary(t.getExecutiveSummary());
        dto.setSellerScore(t.getSellerScore());
        dto.setSellerStrengths(t.getSellerStrengths() != null 
                ? Arrays.asList(t.getSellerStrengths().split(", ")) : new ArrayList<>());
        dto.setSellerWeaknesses(t.getSellerWeaknesses() != null 
                ? Arrays.asList(t.getSellerWeaknesses().split(", ")) : new ArrayList<>());
        dto.setRecordingDate(t.getRecordingDate());
        dto.setAnalyzedAt(t.getAnalyzedAt());
        dto.setAnalyzed(t.getAnalyzed());
        return dto;
    }
    
    /**
     * Elimina una transcripción y su análisis avanzado asociado.
     */
    @Transactional
    public void deleteTranscription(String recordingId) {
        Transcription transcription = repository.findById(recordingId)
                .orElseThrow(() -> new RuntimeException("Transcripción no encontrada: " + recordingId));
        
        // Eliminar análisis avanzado si existe
        advancedAnalysisRepository.findByRecordingId(recordingId)
                .ifPresent(advancedAnalysisRepository::delete);
        
        // Eliminar la transcripción
        repository.delete(transcription);
        
        log.info("Transcripción eliminada: {}", recordingId);
    }
    
    /**
     * Mapea nombres de usuario a nombres reales.
     * Agregar más mapeos según sea necesario.
     */
    private String mapUserName(String originalName) {
        if (originalName == null) return "Desconocido";
        
        // Mapeos hardcodeados
        return switch (originalName.toLowerCase().trim()) {
            case "calm administrator" -> "Matías Vergara";
            case "admin" -> "Matías Vergara";
            default -> originalName;
        };
    }
    
    /**
     * Mapea nombres de sucursal a nombres reales.
     * Agregar más mapeos según sea necesario.
     */
    private String mapBranchName(String originalName) {
        if (originalName == null) return "Desconocida";
        
        // Mapeos hardcodeados
        return switch (originalName.toLowerCase().trim()) {
            case "central" -> "Godoy Cruz";
            default -> originalName;
        };
    }
    
    /**
     * Busca texto en las transcripciones y devuelve resultados con snippets.
     */
    public Map<String, Object> searchTranscriptions(String searchTerm, Long userId, Long branchId, Boolean saleCompleted) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Map.of("results", new ArrayList<>(), "totalResults", 0, "totalMatches", 0);
        }
        
        String term = searchTerm.trim().toLowerCase();
        List<Transcription> transcriptions = repository.searchByText(term, userId, branchId, saleCompleted);
        
        List<SearchResultDTO> results = new ArrayList<>();
        int totalMatches = 0;
        
        for (Transcription t : transcriptions) {
            SearchResultDTO dto = new SearchResultDTO();
            dto.setRecordingId(t.getRecordingId());
            dto.setUserName(t.getUserName());
            dto.setBranchName(t.getBranchName());
            dto.setRecordingDate(t.getRecordingDate());
            dto.setSaleCompleted(t.getSaleCompleted());
            dto.setSaleStatus(t.getSaleStatus());
            dto.setSellerScore(t.getSellerScore());
            
            // Generar snippets
            List<String> snippets = generateSnippets(t.getTranscriptionText(), term, 3);
            dto.setSnippets(snippets);
            
            // Contar coincidencias
            int count = countOccurrences(t.getTranscriptionText(), term);
            dto.setMatchCount(count);
            totalMatches += count;
            
            results.add(dto);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("results", results);
        response.put("totalResults", results.size());
        response.put("totalMatches", totalMatches);
        response.put("searchTerm", searchTerm);
        
        return response;
    }
    
    /**
     * Genera snippets del texto alrededor de las coincidencias.
     */
    private List<String> generateSnippets(String text, String searchTerm, int maxSnippets) {
        List<String> snippets = new ArrayList<>();
        if (text == null || searchTerm == null) return snippets;
        
        String lowerText = text.toLowerCase();
        String lowerTerm = searchTerm.toLowerCase();
        int contextLength = 60; // caracteres antes y después
        
        int index = 0;
        while ((index = lowerText.indexOf(lowerTerm, index)) != -1 && snippets.size() < maxSnippets) {
            int start = Math.max(0, index - contextLength);
            int end = Math.min(text.length(), index + lowerTerm.length() + contextLength);
            
            StringBuilder snippet = new StringBuilder();
            if (start > 0) snippet.append("...");
            
            // Extraer el snippet y marcar la palabra con **
            String before = text.substring(start, index);
            String match = text.substring(index, index + lowerTerm.length());
            String after = text.substring(index + lowerTerm.length(), end);
            
            snippet.append(before).append("**").append(match).append("**").append(after);
            
            if (end < text.length()) snippet.append("...");
            
            // Limpiar saltos de línea
            String cleanSnippet = snippet.toString().replaceAll("\\s+", " ").trim();
            snippets.add(cleanSnippet);
            
            index += lowerTerm.length();
        }
        
        return snippets;
    }
    
    /**
     * Cuenta las ocurrencias de un término en el texto.
     */
    private int countOccurrences(String text, String searchTerm) {
        if (text == null || searchTerm == null) return 0;
        
        String lowerText = text.toLowerCase();
        String lowerTerm = searchTerm.toLowerCase();
        
        int count = 0;
        int index = 0;
        while ((index = lowerText.indexOf(lowerTerm, index)) != -1) {
            count++;
            index += lowerTerm.length();
        }
        return count;
    }
}
