package com.numia.surveys.controller;

import com.numia.surveys.dto.metrics.DashboardMetricsDTO;
import com.numia.surveys.dto.metrics.SurveyAnalyticsDTO;
import com.numia.surveys.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics(HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(companyId));
    }
    
    @GetMapping("/surveys/{surveyId}")
    public ResponseEntity<SurveyAnalyticsDTO> getSurveyAnalytics(
            @PathVariable Long surveyId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(analyticsService.getSurveyAnalytics(surveyId, companyId));
    }
}
