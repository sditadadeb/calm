package com.bancooccidente.admin.controller;

import com.bancooccidente.admin.dto.DashboardMetricsDTO;
import com.bancooccidente.admin.dto.FilterDTO;
import com.bancooccidente.admin.dto.TranscriptionDTO;
import com.bancooccidente.admin.model.User;
import com.bancooccidente.admin.model.TranscriptionComment;
import com.bancooccidente.admin.repository.TranscriptionCommentRepository;
import com.bancooccidente.admin.repository.UserRepository;
import com.bancooccidente.admin.service.S3Service;
import com.bancooccidente.admin.service.TranscriptionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TranscriptionController {

    private final TranscriptionService transcriptionService;
    private final S3Service s3Service;
    private final TranscriptionCommentRepository commentRepository;
    private final UserRepository userRepository;
    
    // Only allow alphanumeric recording IDs (prevent path traversal)
    private static final Pattern VALID_RECORDING_ID = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");

    public TranscriptionController(TranscriptionService transcriptionService, S3Service s3Service,
                                   TranscriptionCommentRepository commentRepository,
                                   UserRepository userRepository) {
        this.transcriptionService = transcriptionService;
        this.s3Service = s3Service;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics() {
        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null) {
            return ResponseEntity.ok(transcriptionService.getDashboardMetricsForSeller(scopedSellerId));
        }
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

        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null) {
            if (userId != null && !userId.equals(scopedSellerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para consultar otro vendedor");
            }
            userId = scopedSellerId;
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
        TranscriptionDTO transcription = transcriptionService.getTranscription(recordingId);
        enforceTranscriptionAccess(transcription);
        return ResponseEntity.ok(transcription);
    }

    @PostMapping("/transcriptions/{recordingId}/analyze")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<TranscriptionDTO> analyzeTranscription(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        return ResponseEntity.ok(transcriptionService.analyzeTranscription(recordingId));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> syncTranscriptions() {
        return ResponseEntity.ok(transcriptionService.forceSync());
    }

    @PostMapping("/transcriptions/check-new")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> checkNewTranscriptions() {
        return ResponseEntity.ok(transcriptionService.quickSync());
    }

    /**
     * Sync with Server-Sent Events for real-time progress updates.
     */
    @GetMapping(value = "/sync/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public SseEmitter syncWithProgress(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");
        return transcriptionService.forceSyncWithProgress();
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<Map<String, Object>>> getSellers() {
        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null) {
            User currentUser = getCurrentUser();
            String sellerName = currentUser != null && currentUser.getSellerName() != null
                    ? currentUser.getSellerName()
                    : currentUser != null ? currentUser.getUsername() : "Usuario";
            return ResponseEntity.ok(List.of(Map.of("id", scopedSellerId, "name", sellerName)));
        }
        return ResponseEntity.ok(transcriptionService.getSellers());
    }

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> getBranches() {
        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null) {
            FilterDTO filter = new FilterDTO();
            filter.setUserId(scopedSellerId);
            List<Map<String, Object>> branches = transcriptionService.getTranscriptions(filter).stream()
                    .filter(t -> t.getBranchId() != null)
                    .collect(Collectors.toMap(
                            TranscriptionDTO::getBranchId,
                            t -> {
                                Map<String, Object> branch = new HashMap<>();
                                branch.put("id", t.getBranchId());
                                branch.put("name", t.getBranchName());
                                return branch;
                            },
                            (a, b) -> a
                    ))
                    .values()
                    .stream()
                    .toList();
            return ResponseEntity.ok(branches);
        }
        return ResponseEntity.ok(transcriptionService.getBranches());
    }
    
    /**
     * Re-analiza solo las transcripciones marcadas como "no venta".
     * ├Ütil para corregir errores de detecci├│n despu├®s de mejorar el prompt.
     */
    @PostMapping("/reanalyze-no-sales")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> reanalyzeNoSales() {
        return ResponseEntity.ok(transcriptionService.reanalyzeNoSales());
    }
    
    /**
     * Re-analiza TODAS las transcripciones con el prompt actual.
     * Usa SSE para mostrar progreso en tiempo real.
     * Solo para administradores.
     */
    @GetMapping(value = "/reanalyze-all/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public SseEmitter reanalyzeAllWithProgress(jakarta.servlet.http.HttpServletResponse response) {
        // Headers needed for SSE through proxies (Render, etc)
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
        return transcriptionService.reanalyzeAllWithProgress();
    }
    
    /**
     * Elimina una transcripci├│n y sus an├ílisis asociados.
     * Solo para administradores.
     */
    @DeleteMapping("/transcriptions/{recordingId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> deleteTranscription(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        transcriptionService.deleteTranscription(recordingId);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Transcripci├│n eliminada correctamente",
            "recordingId", recordingId
        ));
    }
    
    /**
     * Busca texto en las transcripciones.
     * Devuelve resultados con snippets del contexto donde se encontr├│ la palabra.
     */
    @GetMapping("/transcriptions/search")
    public ResponseEntity<Map<String, Object>> searchTranscriptions(
            @RequestParam String q,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Boolean saleCompleted
    ) {
        if (q == null || q.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El t├®rmino de b├║squeda es requerido");
        }
        if (q.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El t├®rmino de b├║squeda debe tener al menos 2 caracteres");
        }
        if (q.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El t├®rmino de b├║squeda no puede exceder 100 caracteres");
        }

        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null) {
            if (userId != null && !userId.equals(scopedSellerId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para consultar otro vendedor");
            }
            userId = scopedSellerId;
        }
        
        return ResponseEntity.ok(transcriptionService.searchTranscriptions(q, userId, branchId, saleCompleted));
    }
    
    /**
     * Verifica si el audio est├í disponible para una transcripci├│n.
     */
    @GetMapping("/transcriptions/{recordingId}/audio")
    public ResponseEntity<Map<String, Object>> getAudioInfo(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        enforceTranscriptionAccess(transcriptionService.getTranscription(recordingId));
        
        boolean exists = s3Service.audioExists(recordingId);
        
        if (!exists) {
            return ResponseEntity.ok(Map.of(
                "available", false,
                "message", "Audio no disponible para esta transcripci├│n"
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
        enforceTranscriptionAccess(transcriptionService.getTranscription(recordingId));
        
        // Primero obtener el tama├▒o total del archivo
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
                // Si el rango es inv├ílido, devolver el archivo completo
            }
        }
        
        // Sin Range header o Range inv├ílido: devolver archivo completo
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recording ID inv├ílido");
        }
    }

    private Long getScopedSellerIdOrNull() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario no encontrado");
        }
        if ("ADMIN".equals(currentUser.getRole()) || "SUPERADMIN".equals(currentUser.getRole())) {
            return null;
        }
        if (currentUser.getSellerId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sin vendedor asignado");
        }
        return currentUser.getSellerId();
    }

    private void enforceTranscriptionAccess(TranscriptionDTO transcription) {
        Long scopedSellerId = getScopedSellerIdOrNull();
        if (scopedSellerId != null && !scopedSellerId.equals(transcription.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado para consultar esta transcripción");
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    // ===== COMMENTS =====

    @GetMapping("/transcriptions/{recordingId}/comments")
    public ResponseEntity<List<Map<String, Object>>> getComments(@PathVariable String recordingId) {
        validateRecordingId(recordingId);
        enforceTranscriptionAccess(transcriptionService.getTranscription(recordingId));
        List<Map<String, Object>> comments = commentRepository
                .findByRecordingIdOrderByCreatedAtAsc(recordingId)
                .stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getId());
                    m.put("authorUsername", c.getAuthorUsername());
                    m.put("content", c.getContent());
                    m.put("createdAt", c.getCreatedAt());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/transcriptions/{recordingId}/comments")
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String recordingId,
            @RequestBody Map<String, String> request) {
        validateRecordingId(recordingId);
        enforceTranscriptionAccess(transcriptionService.getTranscription(recordingId));

        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario no puede estar vac├¡o");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        TranscriptionComment comment = new TranscriptionComment();
        comment.setRecordingId(recordingId);
        comment.setAuthorUsername(username);
        comment.setContent(content.trim());
        commentRepository.save(comment);

        Map<String, Object> response = new HashMap<>();
        response.put("id", comment.getId());
        response.put("authorUsername", comment.getAuthorUsername());
        response.put("content", comment.getContent());
        response.put("createdAt", comment.getCreatedAt());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/transcriptions/{recordingId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable String recordingId,
            @PathVariable Long commentId) {
        validateRecordingId(recordingId);
        TranscriptionComment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null || !comment.getRecordingId().equals(recordingId)) {
            return ResponseEntity.notFound().build();
        }
        commentRepository.delete(comment);
        return ResponseEntity.ok(Map.of("message", "Comentario eliminado"));
    }
}
