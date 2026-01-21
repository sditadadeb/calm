package com.numia.surveys.controller;

import com.numia.surveys.dto.response.SubmitResponseRequest;
import com.numia.surveys.dto.response.SurveyResponseDTO;
import com.numia.surveys.service.ResponseService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responses")
public class ResponseController {
    
    private final ResponseService responseService;
    
    public ResponseController(ResponseService responseService) {
        this.responseService = responseService;
    }
    
    @PostMapping("/submit/{publicId}")
    public ResponseEntity<SurveyResponseDTO> submitResponse(
            @PathVariable String publicId,
            @RequestBody SubmitResponseRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        return ResponseEntity.ok(responseService.submitResponse(publicId, request, ipAddress, userAgent));
    }
    
    @GetMapping("/survey/{surveyId}")
    public ResponseEntity<List<SurveyResponseDTO>> getResponsesBySurvey(
            @PathVariable Long surveyId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(responseService.getResponsesBySurvey(surveyId, companyId));
    }
    
    @GetMapping("/survey/{surveyId}/paginated")
    public ResponseEntity<Page<SurveyResponseDTO>> getResponsesBySurveyPaginated(
            @PathVariable Long surveyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        Sort sort = sortDir.equalsIgnoreCase("asc") ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(responseService.getResponsesBySurveyPaginated(surveyId, companyId, pageRequest));
    }
    
    @GetMapping("/{responseId}")
    public ResponseEntity<SurveyResponseDTO> getResponseDetail(
            @PathVariable Long responseId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(responseService.getResponseDetail(responseId, companyId));
    }
    
    @DeleteMapping("/{responseId}")
    public ResponseEntity<Void> deleteResponse(
            @PathVariable Long responseId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        responseService.deleteResponse(responseId, companyId);
        return ResponseEntity.noContent().build();
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
