package com.calm.admin.controller;

import com.calm.admin.dto.DashboardMetricsDTO;
import com.calm.admin.dto.FilterDTO;
import com.calm.admin.dto.TranscriptionDTO;
import com.calm.admin.service.TranscriptionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
public class TranscriptionController {

    private final TranscriptionService transcriptionService;
    
    // Only allow alphanumeric recording IDs (prevent path traversal)
    private static final Pattern VALID_RECORDING_ID = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");

    public TranscriptionController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics() {
        return ResponseEntity.ok(transcriptionService.getDashboardMetrics());
    }

    @GetMapping("/transcriptions")
    public ResponseEntity<List<TranscriptionDTO>> getTranscriptions(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Boolean saleCompleted,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore
    ) {
        // Validate score range
        if (minScore != null && (minScore < 0 || minScore > 10)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minScore debe estar entre 0 y 10");
        }
        if (maxScore != null && (maxScore < 0 || maxScore > 10)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxScore debe estar entre 0 y 10");
        }
        if (minScore != null && maxScore != null && minScore > maxScore) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minScore no puede ser mayor que maxScore");
        }
        
        // Validate date range
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateFrom no puede ser posterior a dateTo");
        }

        FilterDTO filter = new FilterDTO();
        filter.setUserId(userId);
        filter.setBranchId(branchId);
        filter.setSaleCompleted(saleCompleted);
        filter.setDateFrom(dateFrom);
        filter.setDateTo(dateTo);
        filter.setMinScore(minScore);
        filter.setMaxScore(maxScore);
        
        return ResponseEntity.ok(transcriptionService.getTranscriptions(filter));
    }

    @GetMapping("/transcriptions/{recordingId}")
    public ResponseEntity<TranscriptionDTO> getTranscription(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        return ResponseEntity.ok(transcriptionService.getTranscription(recordingId));
    }

    @PostMapping("/transcriptions/{recordingId}/analyze")
    public ResponseEntity<TranscriptionDTO> analyzeTranscription(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        return ResponseEntity.ok(transcriptionService.analyzeTranscription(recordingId));
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncTranscriptions() {
        return ResponseEntity.ok(transcriptionService.forceSync());
    }

    /**
     * Sync with Server-Sent Events for real-time progress updates.
     */
    @GetMapping(value = "/sync/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter syncWithProgress() {
        return transcriptionService.forceSyncWithProgress();
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<Map<String, Object>>> getSellers() {
        return ResponseEntity.ok(transcriptionService.getSellers());
    }

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> getBranches() {
        return ResponseEntity.ok(transcriptionService.getBranches());
    }
    
    /**
     * Re-analiza solo las transcripciones marcadas como "no venta".
     * Útil para corregir errores de detección después de mejorar el prompt.
     */
    @PostMapping("/reanalyze-no-sales")
    public ResponseEntity<Map<String, Object>> reanalyzeNoSales() {
        return ResponseEntity.ok(transcriptionService.reanalyzeNoSales());
    }
    
    /**
     * Re-analiza TODAS las transcripciones con el prompt actual.
     * Usa SSE para mostrar progreso en tiempo real.
     * Solo para administradores.
     */
    @GetMapping(value = "/reanalyze-all/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter reanalyzeAllWithProgress() {
        return transcriptionService.reanalyzeAllWithProgress();
    }
    
    /**
     * Elimina una transcripción y sus análisis asociados.
     * Solo para administradores.
     */
    @DeleteMapping("/transcriptions/{recordingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteTranscription(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        transcriptionService.deleteTranscription(recordingId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Transcripción eliminada correctamente",
            "recordingId", recordingId
        ));
    }
    
    /**
     * Validates recording ID to prevent path traversal and injection attacks.
     */
    private void validateRecordingId(String recordingId) {
        if (recordingId == null || recordingId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recording ID es requerido");
        }
        if (!VALID_RECORDING_ID.matcher(recordingId).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recording ID inválido");
        }
    }
}
