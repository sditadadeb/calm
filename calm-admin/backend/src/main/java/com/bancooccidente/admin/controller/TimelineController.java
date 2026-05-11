package com.bancooccidente.admin.controller;

import com.bancooccidente.admin.model.TimelineEvent;
import com.bancooccidente.admin.repository.TimelineEventRepository;
import com.bancooccidente.admin.repository.TranscriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timeline")
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
public class TimelineController {

    private final TimelineEventRepository eventRepository;
    private final TranscriptionRepository transcriptionRepository;

    public TimelineController(TimelineEventRepository eventRepository,
                              TranscriptionRepository transcriptionRepository) {
        this.eventRepository = eventRepository;
        this.transcriptionRepository = transcriptionRepository;
    }

    @GetMapping("/events")
    public ResponseEntity<List<TimelineEvent>> getEvents() {
        return ResponseEntity.ok(eventRepository.findAllByOrderByEventDateAsc());
    }

    @PostMapping("/events")
    public ResponseEntity<TimelineEvent> createEvent(@RequestBody TimelineEvent event) {
        if (event.getTitle() == null || event.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El titulo es requerido");
        }
        if (event.getEventDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha es requerida");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        event.setCreatedBy(username);
        event.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(eventRepository.save(event));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<TimelineEvent> updateEvent(@PathVariable Long id, @RequestBody TimelineEvent update) {
        TimelineEvent existing = eventRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        if (update.getTitle() != null && !update.getTitle().isBlank()) existing.setTitle(update.getTitle());
        if (update.getEventDate() != null) existing.setEventDate(update.getEventDate());
        if (update.getCategory() != null) existing.setCategory(update.getCategory());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        return ResponseEntity.ok(eventRepository.save(existing));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Evento eliminado"));
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics(
            @RequestParam(defaultValue = "week") String groupBy,
            @RequestParam(required = false) Long sellerId
    ) {
        var all = transcriptionRepository.findAll();

        var analyzed = all.stream()
                .filter(t -> Boolean.TRUE.equals(t.getAnalyzed()))
                .filter(t -> t.getRecordingDate() != null)
                .filter(t -> sellerId == null || sellerId.equals(t.getUserId()))
                .collect(Collectors.toList());

        Map<String, List<com.bancooccidente.admin.model.Transcription>> grouped;

        if ("month".equals(groupBy)) {
            grouped = analyzed.stream().collect(Collectors.groupingBy(
                    t -> {
                        LocalDate d = t.getRecordingDate().toLocalDate();
                        return d.getYear() + "-" + String.format("%02d", d.getMonthValue());
                    },
                    TreeMap::new,
                    Collectors.toList()
            ));
        } else {
            grouped = analyzed.stream().collect(Collectors.groupingBy(
                    t -> {
                        LocalDate d = t.getRecordingDate().toLocalDate();
                        LocalDate weekStart = d.minusDays(d.getDayOfWeek().getValue() - 1);
                        return weekStart.toString();
                    },
                    TreeMap::new,
                    Collectors.toList()
            ));
        }

        List<Map<String, Object>> series = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            var list = entry.getValue();
            long total = list.size();
            long sales = list.stream().filter(t -> Boolean.TRUE.equals(t.getSaleCompleted())).count();
            double saleRate = total > 0 ? Math.round(sales * 1000.0 / total) / 10.0 : 0;
            double avgScore = list.stream()
                    .filter(t -> t.getSellerScore() != null)
                    .mapToInt(com.bancooccidente.admin.model.Transcription::getSellerScore)
                    .average().orElse(0);
            double avgConfidence = list.stream()
                    .filter(t -> t.getAnalysisConfidence() != null)
                    .mapToInt(com.bancooccidente.admin.model.Transcription::getAnalysisConfidence)
                    .average().orElse(0);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("period", entry.getKey());
            point.put("total", total);
            point.put("sales", sales);
            point.put("saleRate", saleRate);
            point.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
            point.put("avgConfidence", Math.round(avgConfidence * 10.0) / 10.0);
            series.add(point);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("groupBy", groupBy);
        result.put("series", series);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareAroundEvent(
            @RequestParam String eventDate,
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(required = false) Long sellerId
    ) {
        LocalDate pivot = LocalDate.parse(eventDate);
        LocalDateTime beforeStart = pivot.minusDays(days).atStartOfDay();
        LocalDateTime beforeEnd = pivot.atStartOfDay();
        LocalDateTime afterStart = pivot.atStartOfDay();
        LocalDateTime afterEnd = pivot.plusDays(days).atTime(23, 59, 59);

        var all = transcriptionRepository.findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getAnalyzed()) && t.getRecordingDate() != null)
                .filter(t -> sellerId == null || sellerId.equals(t.getUserId()))
                .collect(Collectors.toList());

        var before = all.stream()
                .filter(t -> !t.getRecordingDate().isBefore(beforeStart) && t.getRecordingDate().isBefore(beforeEnd))
                .collect(Collectors.toList());

        var after = all.stream()
                .filter(t -> !t.getRecordingDate().isBefore(afterStart) && !t.getRecordingDate().isAfter(afterEnd))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("before", buildPeriodStats(before));
        result.put("after", buildPeriodStats(after));
        result.put("dayRange", days);
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> buildPeriodStats(List<com.bancooccidente.admin.model.Transcription> list) {
        long total = list.size();
        long sales = list.stream().filter(t -> Boolean.TRUE.equals(t.getSaleCompleted())).count();
        double saleRate = total > 0 ? Math.round(sales * 1000.0 / total) / 10.0 : 0;
        double avgScore = list.stream()
                .filter(t -> t.getSellerScore() != null)
                .mapToInt(com.bancooccidente.admin.model.Transcription::getSellerScore)
                .average().orElse(0);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("sales", sales);
        stats.put("saleRate", saleRate);
        stats.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
        return stats;
    }
}
