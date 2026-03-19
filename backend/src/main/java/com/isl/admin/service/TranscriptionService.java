package com.isl.admin.service;

import com.isl.admin.dto.DashboardMetricsDTO;
import com.isl.admin.dto.FilterDTO;
import com.isl.admin.dto.SearchResultDTO;
import com.isl.admin.dto.TranscriptionDTO;
import com.isl.admin.model.AnalysisResult;
import com.isl.admin.model.Transcription;
import com.isl.admin.repository.AdvancedAnalysisRepository;
import com.isl.admin.repository.TranscriptionRepository;
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
    private static final long AUTO_SYNC_CHECK_INTERVAL_MS = 120_000L;
    private static final long AUTO_SYNC_FORCE_INTERVAL_MS = 900_000L;

    private final TranscriptionRepository repository;
    private final AdvancedAnalysisRepository advancedAnalysisRepository;
    private final S3Service s3Service;
    private final ChatGPTAnalyzerService analyzerService;
    private final java.util.concurrent.locks.ReentrantLock autoSyncLock = new java.util.concurrent.locks.ReentrantLock();
    private volatile long lastAutoSyncCheckAtMillis = 0L;
    private volatile long lastFullSyncAtMillis = 0L;
    private volatile int lastKnownS3Count = -1;

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
        Set<String> existingIds = new HashSet<>(repository.findAllRecordingIds());
        int newCount = 0;
        
        for (String recordingId : recordingIds) {
            if (existingIds.contains(recordingId)) {
                continue;
            }
            try {
                Transcription imported = importTranscription(recordingId);
                if (imported != null) {
                    newCount++;
                    existingIds.add(recordingId);
                }
            } catch (Exception e) {
                log.error("Error importing transcription {}: {}", recordingId, e.getMessage());
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
    public int analyzeUnprocessedTranscriptions() {
        List<Transcription> unanalyzed = repository.findByAnalyzedFalse();
        log.info("Found {} unanalyzed transcriptions", unanalyzed.size());
        int analyzed = 0;
        for (Transcription transcription : unanalyzed) {
            try {
                analyzeTranscription(transcription.getRecordingId());
                analyzed++;
            } catch (Exception e) {
                log.error("Error analyzing transcription {}: {}", transcription.getRecordingId(), e.getMessage());
            }
        }
        return analyzed;
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
        // Compatibilidad: mapear categorías de no resolución como motivo principal cuando no exista.
        transcription.setMotivoPrincipal(analysis.getNoSaleReason());
        transcription.setResultadoLlamada(mapSaleStatusToResultado(analysis.getSaleStatus()));
        transcription.setProductsDiscussed(String.join(", ", analysis.getProductsDiscussed()));
        transcription.setCustomerObjections(String.join(", ", analysis.getCustomerObjections()));
        transcription.setImprovementSuggestions(String.join(", ", analysis.getImprovementSuggestions()));
        transcription.setAnalysisPayload(analysis.getAnalysisPayload());
        transcription.setFollowUpRecommendation(analysis.getFollowUpRecommendation());
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
                    filter.getResultadoLlamada(),
                    filter.getMotivoPrincipal(),
                    filter.getDateFrom() != null ? filter.getDateFrom().atStartOfDay() : null,
                    filter.getDateTo() != null ? filter.getDateTo().atTime(23, 59, 59) : null,
                    filter.getMinScore(),
                    filter.getMaxScore()
            );
        } else {
            transcriptions = repository.findByAnalyzedTrueOrderByRecordingDateDesc();
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
        long total = repository.countAnalyzed();
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

        List<Transcription> analyzedTranscriptions = repository.findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getAnalyzed()))
                .collect(Collectors.toList());

        Map<String, Long> callReasons = analyzedTranscriptions.stream()
                .map(t -> normalizeLabel(firstNonBlank(t.getMotivoPrincipal(), t.getNoSaleReason(), "Sin clasificar")))
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        Map<String, Long> nextSteps = analyzedTranscriptions.stream()
                .map(t -> normalizeLabel(extractNextStep(t)))
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        Map<String, Long> recordingToBranchId = analyzedTranscriptions.stream()
                .filter(t -> t.getRecordingId() != null)
                .collect(Collectors.toMap(
                        Transcription::getRecordingId,
                        t -> t.getBranchId() != null ? t.getBranchId() : -1L,
                        (a, b) -> a
                ));

        Map<String, String> recordingToBranchName = analyzedTranscriptions.stream()
                .filter(t -> t.getRecordingId() != null)
                .collect(Collectors.toMap(
                        Transcription::getRecordingId,
                        t -> normalizeLabel(firstNonBlank(t.getBranchName(), "Sin sucursal")),
                        (a, b) -> a
                ));

        List<com.isl.admin.model.AdvancedAnalysis> advancedAnalyses = advancedAnalysisRepository.findAll().stream()
                .filter(a -> a.getCustomerConfidenceScore() != null)
                .collect(Collectors.toList());

        double customerSatisfaction = Math.round(
                advancedAnalyses.stream()
                        .mapToInt(com.isl.admin.model.AdvancedAnalysis::getCustomerConfidenceScore)
                        .average().orElse(0.0) * 100.0
        ) / 100.0;

        Map<String, List<com.isl.admin.model.AdvancedAnalysis>> analysesByBranch = advancedAnalyses.stream()
                .collect(Collectors.groupingBy(
                        a -> recordingToBranchId.getOrDefault(a.getRecordingId(), -1L) + "|" +
                                recordingToBranchName.getOrDefault(a.getRecordingId(), "Sin sucursal")
                ));

        List<DashboardMetricsDTO.BranchSatisfaction> customerSatisfactionByBranch = analysesByBranch.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("\\|", 2);
                    DashboardMetricsDTO.BranchSatisfaction bs = new DashboardMetricsDTO.BranchSatisfaction();
                    bs.setBranchId(Long.parseLong(parts[0]));
                    bs.setBranchName(parts.length > 1 ? parts[1] : "Sin sucursal");
                    bs.setTotalInteractions(entry.getValue().size());
                    bs.setSatisfaction(Math.round(entry.getValue().stream()
                            .mapToInt(com.isl.admin.model.AdvancedAnalysis::getCustomerConfidenceScore)
                            .average().orElse(0.0) * 100.0) / 100.0);
                    return bs;
                })
                .sorted((a, b) -> Double.compare(b.getSatisfaction(), a.getSatisfaction()))
                .collect(Collectors.toList());
        
        DashboardMetricsDTO metrics = new DashboardMetricsDTO();
        metrics.setTotalTranscriptions(total);
        metrics.setAnalyzedTranscriptions(analyzed);
        metrics.setPendingAnalysis(pendingAnalysis);
        metrics.setTotalSales(sales);
        metrics.setTotalNoSales(noSales);
        // Resolución basada en ANALIZADAS, no en total
        metrics.setConversionRate(calculateRate(sales, analyzed));
        metrics.setAverageSellerScore(avgScore != null ? avgScore : 0.0);
        metrics.setSellerMetrics(sellerMetrics);
        metrics.setBranchMetrics(branchMetrics);
        metrics.setNoSaleReasons(noSaleReasons);
        metrics.setCallReasons(callReasons);
        metrics.setNextSteps(nextSteps);
        metrics.setCustomerSatisfaction(customerSatisfaction);
        metrics.setCustomerSatisfactionByBranch(customerSatisfactionByBranch);
        
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

    /**
     * Auto-sync performante:
     * - No ejecuta en cada request (throttle por intervalo).
     * - Si hay pendientes, analiza solo pendientes sin volver a escanear S3.
     * - Compara conteo S3 vs DB y sincroniza completo solo si hay diferencia.
     */
    public void autoSyncIfNeeded() {
        long now = System.currentTimeMillis();
        if ((now - lastAutoSyncCheckAtMillis) < AUTO_SYNC_CHECK_INTERVAL_MS) {
            return;
        }
        if (!autoSyncLock.tryLock()) {
            return;
        }
        try {
            long checkNow = System.currentTimeMillis();
            if ((checkNow - lastAutoSyncCheckAtMillis) < AUTO_SYNC_CHECK_INTERVAL_MS) {
                return;
            }
            lastAutoSyncCheckAtMillis = checkNow;

            long pending = repository.countPendingAnalysis();
            if (pending > 0) {
                int analyzed = analyzeUnprocessedTranscriptions();
                log.info("Auto-sync liviano: analizados pendientes={}", analyzed);
                return;
            }

            long dbCount = repository.count();
            boolean forceByTime = (checkNow - lastFullSyncAtMillis) >= AUTO_SYNC_FORCE_INTERVAL_MS;

            int s3Count = s3Service.countAvailableRecordings();
            if (s3Count >= 0) {
                lastKnownS3Count = s3Count;
            }

            boolean needsSync = forceByTime || (s3Count >= 0 && s3Count > dbCount);
            if (!needsSync) {
                return;
            }

            Map<String, Object> result = forceSync();
            lastFullSyncAtMillis = System.currentTimeMillis();
            log.info("Auto-sync completo ejecutado. imported={}, analyzed={}",
                    result.getOrDefault("imported", 0),
                    result.getOrDefault("analyzed", 0));
        } catch (Exception e) {
            log.warn("Auto-sync falló: {}", e.getMessage());
        } finally {
            autoSyncLock.unlock();
        }
    }

    @Transactional
    public Map<String, Object> forceSync() {
        long beforeCount = repository.count();
        syncTranscriptions();
        long afterCount = repository.count();
        long imported = afterCount - beforeCount;

        Map<String, Object> result = new HashMap<>();
        result.put("previousCount", beforeCount);
        result.put("newCount", afterCount);
        result.put("imported", imported);
        result.put("analyzed", 0);
        result.put("timestamp", LocalDateTime.now());
        
        return result;
    }

    @Transactional
    public Map<String, Object> resetAllAnalysisData() {
        List<Transcription> all = repository.findAll();
        int affected = 0;
        for (Transcription t : all) {
            t.setSaleCompleted(null);
            t.setSaleStatus(null);
            t.setAnalysisConfidence(null);
            t.setConfidenceTrace(null);
            t.setSaleEvidence(null);
            t.setSaleEvidenceMeta(null);
            t.setNoSaleReason(null);
            t.setMotivoPrincipal(null);
            t.setResultadoLlamada(null);
            t.setProductsDiscussed(null);
            t.setCustomerObjections(null);
            t.setImprovementSuggestions(null);
            t.setAnalysisPayload(null);
            t.setFollowUpRecommendation(null);
            t.setExecutiveSummary(null);
            t.setSellerScore(null);
            t.setSellerStrengths(null);
            t.setSellerWeaknesses(null);
            t.setAnalyzed(false);
            t.setAnalyzedAt(null);
            affected++;
        }
        repository.saveAll(all);
        long advancedDeleted = advancedAnalysisRepository.count();
        advancedAnalysisRepository.deleteAll();

        Map<String, Object> result = new HashMap<>();
        result.put("transcriptionsReset", affected);
        result.put("advancedDeleted", advancedDeleted);
        result.put("timestamp", LocalDateTime.now());
        return result;
    }

    /**
     * Sync with Server-Sent Events for real-time progress updates.
     */
    public SseEmitter forceSyncWithProgress() {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutes timeout
        ExecutorService executor = Executors.newSingleThreadExecutor();
        final boolean[] closed = { false };

        executor.execute(() -> {
            try {
                // Primer evento inmediato: asegura 200 + inicio del chunked stream
                sendEventOrThrow(emitter, "phase", "import", "Conectando...", 0, 0);

                // Phase 1: Import from S3
                sendEventOrThrow(emitter, "phase", "import", "Importando desde S3...", 0, 0);

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
                
                // Complete
                Map<String, Object> result = new HashMap<>();
                result.put("imported", importedCount);
                result.put("analyzed", 0);
                result.put("timestamp", LocalDateTime.now().toString());
                
                sendEvent(emitter, "complete", null, "Sincronización completada", importedCount, totalToImport);
                emitter.send(SseEmitter.event().name("result").data(result));
                closed[0] = true;
                emitter.complete();
            } catch (Throwable e) {
                log.error("Error during sync with progress: {}", e.getMessage(), e);
                if (!closed[0]) {
                    try {
                        emitter.send(SseEmitter.event().name("error").data(Map.of("message", String.valueOf(e.getMessage()))));
                    } catch (Throwable ignored) {}
                    try {
                        closed[0] = true;
                        emitter.complete();
                    } catch (Throwable ignored) {}
                }
            } finally {
                executor.shutdown();
                if (!closed[0]) {
                    try { closed[0] = true; emitter.complete(); } catch (Throwable ignored) {}
                }
            }
        });

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(() -> executor.shutdown());
        emitter.onError((ex) -> executor.shutdown());
        
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

    /** Envía un evento y lanza si falla (para abortar sync y cerrar stream limpio). */
    private void sendEventOrThrow(SseEmitter emitter, String type, String id, String message, int current, int total) throws IOException {
        Map<String, Object> data = new HashMap<>();
        data.put("type", type);
        data.put("id", id);
        data.put("message", message);
        data.put("current", current);
        data.put("total", total);
        data.put("percent", total > 0 ? Math.round((current * 100.0) / total) : 0);
        emitter.send(SseEmitter.event().name("progress").data(data));
    }
    
    /**
     * Re-analiza solo las transcripciones marcadas como "no venta".
     * Útil para corregir posibles errores de detección después de mejorar el prompt.
     */
    @Transactional
    public Map<String, Object> reanalyzeNoSales() {
        List<Transcription> noSales = repository.findAnalyzedNoSales();
        log.info("🔄 Re-analizando {} transcripciones marcadas como 'no resuelto'...", noSales.size());
        
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
        
        log.info("🏁 Re-análisis completado: {} procesadas, {} corregidas a resuelto", reanalyzed, corrected);
        
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
        transcription.setMotivoPrincipal(analysis.getNoSaleReason());
        transcription.setResultadoLlamada(mapSaleStatusToResultado(analysis.getSaleStatus()));
        transcription.setProductsDiscussed(String.join(", ", analysis.getProductsDiscussed()));
        transcription.setCustomerObjections(String.join(", ", analysis.getCustomerObjections()));
        transcription.setImprovementSuggestions(String.join(", ", analysis.getImprovementSuggestions()));
        transcription.setAnalysisPayload(analysis.getAnalysisPayload());
        transcription.setFollowUpRecommendation(analysis.getFollowUpRecommendation());
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
               (filter.getResultadoLlamada() != null && !filter.getResultadoLlamada().isBlank()) ||
               (filter.getMotivoPrincipal() != null && !filter.getMotivoPrincipal().isBlank()) ||
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
        dto.setMotivoPrincipal(t.getMotivoPrincipal());
        dto.setResultadoLlamada(t.getResultadoLlamada());
        dto.setProductsDiscussed(t.getProductsDiscussed() != null 
                ? Arrays.asList(t.getProductsDiscussed().split(", ")) : new ArrayList<>());
        dto.setCustomerObjections(t.getCustomerObjections() != null 
                ? Arrays.asList(t.getCustomerObjections().split(", ")) : new ArrayList<>());
        dto.setImprovementSuggestions(t.getImprovementSuggestions() != null 
                ? Arrays.asList(t.getImprovementSuggestions().split(", ")) : new ArrayList<>());
        dto.setAnalysisPayload(t.getAnalysisPayload());
        dto.setFollowUpRecommendation(t.getFollowUpRecommendation());
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

    private String mapSaleStatusToResultado(String saleStatus) {
        if (saleStatus == null) return null;
        return switch (saleStatus) {
            case "SALE_CONFIRMED" -> "resuelto";
            case "SALE_LIKELY", "ADVANCE_NO_CLOSE" -> "parcial";
            case "NO_SALE" -> "no resuelto";
            case "UNINTERPRETABLE" -> "falta info";
            default -> null;
        };
    }

    private String extractNextStep(Transcription t) {
        String followUp = firstNonBlank(t.getFollowUpRecommendation());
        if (followUp != null) return followUp;
        if (t.getImprovementSuggestions() != null && !t.getImprovementSuggestions().isBlank()) {
            String first = t.getImprovementSuggestions().split(",")[0].trim();
            if (!first.isBlank()) return first;
        }
        return "Sin próximo paso";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private String normalizeLabel(String value) {
        if (value == null || value.isBlank()) return "Sin clasificar";
        return value.trim().replaceAll("\\s{2,}", " ");
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
