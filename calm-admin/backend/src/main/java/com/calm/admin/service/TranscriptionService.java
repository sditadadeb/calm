package com.calm.admin.service;

import com.calm.admin.dto.DashboardMetricsDTO;
import com.calm.admin.dto.FilterDTO;
import com.calm.admin.dto.TranscriptionDTO;
import com.calm.admin.model.AnalysisResult;
import com.calm.admin.model.Transcription;
import com.calm.admin.repository.TranscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);

    private final TranscriptionRepository repository;
    private final S3Service s3Service;
    private final ChatGPTAnalyzerService analyzerService;

    public TranscriptionService(TranscriptionRepository repository, S3Service s3Service, ChatGPTAnalyzerService analyzerService) {
        this.repository = repository;
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
        
        Transcription transcription = new Transcription();
        transcription.setRecordingId(recordingId);
        transcription.setUserId(metadata.get("userId") != null ? (Long) metadata.get("userId") : null);
        transcription.setUserName(metadata.get("userName") != null ? (String) metadata.get("userName") : "Desconocido");
        transcription.setBranchId(metadata.get("branchId") != null ? (Long) metadata.get("branchId") : null);
        transcription.setBranchName(metadata.get("branchName") != null ? (String) metadata.get("branchName") : "Desconocida");
        transcription.setTranscriptionText(transcriptionText);
        transcription.setRecordingDate(LocalDateTime.now());
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
                    sm.setNoSales(((Number) row[3]).longValue() - ((Number) row[4]).longValue());
                    sm.setConversionRate(calculateRate(((Number) row[4]).longValue(), ((Number) row[3]).longValue()));
                    sm.setAverageScore(row[5] != null ? ((Number) row[5]).doubleValue() : 0.0);
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
                    bm.setNoSales(((Number) row[2]).longValue() - ((Number) row[3]).longValue());
                    bm.setConversionRate(calculateRate(((Number) row[3]).longValue(), ((Number) row[2]).longValue()));
                    bm.setAverageScore(row[4] != null ? ((Number) row[4]).doubleValue() : 0.0);
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
        metrics.setTotalSales(sales);
        metrics.setTotalNoSales(noSales);
        metrics.setConversionRate(calculateRate(sales, total));
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
}
