package com.calm.admin.controller;

import com.calm.admin.service.AdvancedAnalyzerService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationsController {
    
    private final AdvancedAnalyzerService advancedAnalyzerService;
    
    public RecommendationsController(AdvancedAnalyzerService advancedAnalyzerService) {
        this.advancedAnalyzerService = advancedAnalyzerService;
    }
    
    /**
     * Obtiene métricas agregadas para el dashboard de recomendaciones
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(advancedAnalyzerService.getAggregatedMetrics());
    }
    
    /**
     * Obtiene métricas desglosadas por vendedor
     */
    @GetMapping("/by-vendor")
    public ResponseEntity<List<Map<String, Object>>> getMetricsByVendor() {
        return ResponseEntity.ok(advancedAnalyzerService.getMetricsByVendor());
    }
    
    /**
     * Ejecuta el análisis avanzado con progreso en tiempo real (SSE)
     * Solo ADMIN puede ejecutar
     */
    @GetMapping(value = "/analyze/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter runAnalysisWithProgress() {
        return advancedAnalyzerService.runAdvancedAnalysisWithProgress();
    }
    
    /**
     * Obtiene lista de transcripciones sin análisis
     */
    @GetMapping("/missing")
    public ResponseEntity<List<Map<String, Object>>> getMissing() {
        return ResponseEntity.ok(advancedAnalyzerService.getMissingAnalyses());
    }
    
    /**
     * Reintenta análisis de transcripciones faltantes (SSE)
     * Solo ADMIN puede ejecutar
     */
    @GetMapping(value = "/retry/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter retryMissing() {
        return advancedAnalyzerService.retryMissingAnalyses();
    }
}
