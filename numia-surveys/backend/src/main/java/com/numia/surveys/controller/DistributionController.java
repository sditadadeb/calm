package com.numia.surveys.controller;

import com.numia.surveys.dto.distribution.CreateDistributionRequest;
import com.numia.surveys.dto.distribution.DistributionDTO;
import com.numia.surveys.service.DistributionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/distributions")
public class DistributionController {
    
    private final DistributionService distributionService;
    
    public DistributionController(DistributionService distributionService) {
        this.distributionService = distributionService;
    }
    
    @PostMapping
    public ResponseEntity<DistributionDTO> createDistribution(
            @Valid @RequestBody CreateDistributionRequest request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        Long userId = (Long) httpRequest.getAttribute("userId");
        return ResponseEntity.ok(distributionService.createDistribution(request, companyId, userId));
    }
    
    @GetMapping
    public ResponseEntity<List<DistributionDTO>> getDistributions(HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(distributionService.getDistributionsByCompany(companyId));
    }
    
    @GetMapping("/survey/{surveyId}")
    public ResponseEntity<List<DistributionDTO>> getDistributionsBySurvey(
            @PathVariable Long surveyId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(distributionService.getDistributionsBySurvey(surveyId, companyId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DistributionDTO> getDistribution(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(distributionService.getDistribution(id, companyId));
    }
    
    @PostMapping("/{id}/send")
    public ResponseEntity<Void> sendDistribution(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        // Verify access first
        distributionService.getDistribution(id, companyId);
        distributionService.sendDistribution(id);
        return ResponseEntity.accepted().build();
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelDistribution(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        distributionService.cancelDistribution(id, companyId);
        return ResponseEntity.ok().build();
    }
}
