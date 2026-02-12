package com.calm.admin.controller;

import com.calm.admin.dto.DashboardMetricsDTO;
import com.calm.admin.dto.FilterDTO;
import com.calm.admin.dto.TranscriptionDTO;
import com.calm.admin.service.S3Service;
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
    private final S3Service s3Service;
    
    // Only allow alphanumeric recording IDs (prevent path traversal)
    private static final Pattern VALID_RECORDING_ID = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");

    public TranscriptionController(TranscriptionService transcriptionService, S3Service s3Service) {
        this.transcriptionService = transcriptionService;
        this.s3Service = s3Service;
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
    public SseEmitter reanalyzeAllWithProgress(jakarta.servlet.http.HttpServletResponse response) {
        // Headers needed for SSE through proxies (Render, etc)
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
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
     * Busca texto en las transcripciones.
     * Devuelve resultados con snippets del contexto donde se encontró la palabra.
     */
    @GetMapping("/transcriptions/search")
    public ResponseEntity<Map<String, Object>> searchTranscriptions(
            @RequestParam String q,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Boolean saleCompleted
    ) {
        if (q == null || q.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El término de búsqueda es requerido");
        }
        if (q.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El término de búsqueda debe tener al menos 2 caracteres");
        }
        if (q.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El término de búsqueda no puede exceder 100 caracteres");
        }
        
        return ResponseEntity.ok(transcriptionService.searchTranscriptions(q, userId, branchId, saleCompleted));
    }
    
    /**
     * Verifica si el audio está disponible para una transcripción.
     */
    @GetMapping("/transcriptions/{recordingId}/audio")
    public ResponseEntity<Map<String, Object>> getAudioInfo(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        
        boolean exists = s3Service.audioExists(recordingId);
        
        if (!exists) {
            return ResponseEntity.ok(Map.of(
                "available", false,
                "message", "Audio no disponible para esta transcripción"
            ));
        }
        
        long size = s3Service.getAudioSize(recordingId);
        
        return ResponseEntity.ok(Map.of(
            "available", true,
            "url", "/api/transcriptions/" + recordingId + "/audio/stream",
            "size", size
        ));
    }
    
    /**
     * Sirve el audio como proxy desde S3 (evita problemas de CORS).
     * Soporta Range requests para permitir seeking en el reproductor.
     */
    @GetMapping("/transcriptions/{recordingId}/audio/stream")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> streamAudio(
            @PathVariable String recordingId,
            @RequestHeader(value = "Range", required = false) String rangeHeader
    ) {
        validateRecordingId(recordingId);
        
        // Primero obtener el tamaño total del archivo
        long totalSize = s3Service.getAudioSize(recordingId);
        if (totalSize <= 0) {
            return ResponseEntity.notFound().build();
        }
        
        var headers = new org.springframework.http.HttpHeaders();
        headers.set("Content-Type", "audio/webm");
        headers.set("Accept-Ranges", "bytes");
        
        // Si hay Range header, procesar la solicitud parcial
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            try {
                String rangeValue = rangeHeader.substring(6); // quitar "bytes="
                String[] parts = rangeValue.split("-");
                
                long start = Long.parseLong(parts[0]);
                long end = parts.length > 1 && !parts[1].isEmpty() 
                    ? Long.parseLong(parts[1]) 
                    : totalSize - 1;
                
                // Validar rango
                if (start >= totalSize) {
                    return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                            .header("Content-Range", "bytes */" + totalSize)
                            .build();
                }
                
                end = Math.min(end, totalSize - 1);
                long contentLength = end - start + 1;
                
                // Obtener stream con rango
                var audioStream = s3Service.getAudioStream(recordingId, rangeHeader);
                if (audioStream == null) {
                    return ResponseEntity.notFound().build();
                }
                
                headers.set("Content-Length", String.valueOf(contentLength));
                headers.set("Content-Range", String.format("bytes %d-%d/%d", start, end, totalSize));
                
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .headers(headers)
                        .body(new org.springframework.core.io.InputStreamResource(audioStream));
                        
            } catch (NumberFormatException e) {
                // Si el rango es inválido, devolver el archivo completo
            }
        }
        
        // Sin Range header o Range inválido: devolver archivo completo
        var audioStream = s3Service.getAudioStream(recordingId);
        if (audioStream == null) {
            return ResponseEntity.notFound().build();
        }
        
        headers.set("Content-Length", String.valueOf(totalSize));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(new org.springframework.core.io.InputStreamResource(audioStream));
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
