package com.numia.surveys.controller;

import com.numia.surveys.dto.survey.*;
import com.numia.surveys.service.SurveyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {
    
    private final SurveyService surveyService;
    
    public SurveyController(SurveyService surveyService) {
        this.surveyService = surveyService;
    }
    
    @PostMapping
    public ResponseEntity<SurveyDTO> createSurvey(
            @Valid @RequestBody CreateSurveyRequest request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        Long userId = (Long) httpRequest.getAttribute("userId");
        return ResponseEntity.ok(surveyService.createSurvey(request, companyId, userId));
    }
    
    @GetMapping
    public ResponseEntity<List<SurveyDTO>> getSurveys(HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.getSurveysByCompany(companyId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SurveyDTO> getSurvey(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.getSurvey(id, companyId));
    }
    
    @GetMapping("/public/{publicId}")
    public ResponseEntity<SurveyDTO> getPublicSurvey(@PathVariable String publicId) {
        return ResponseEntity.ok(surveyService.getPublicSurvey(publicId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SurveyDTO> updateSurvey(
            @PathVariable Long id,
            @Valid @RequestBody CreateSurveyRequest request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.updateSurvey(id, request, companyId));
    }
    
    @PostMapping("/{id}/publish")
    public ResponseEntity<SurveyDTO> publishSurvey(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.publishSurvey(id, companyId));
    }
    
    @PostMapping("/{id}/close")
    public ResponseEntity<SurveyDTO> closeSurvey(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.closeSurvey(id, companyId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurvey(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        surveyService.deleteSurvey(id, companyId);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{surveyId}/questions")
    public ResponseEntity<QuestionDTO> addQuestion(
            @PathVariable Long surveyId,
            @Valid @RequestBody CreateQuestionRequest request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.addQuestion(surveyId, request, companyId));
    }
    
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<QuestionDTO> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateQuestionRequest request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(surveyService.updateQuestion(questionId, request, companyId));
    }
    
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId, HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        surveyService.deleteQuestion(questionId, companyId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{surveyId}/questions/reorder")
    public ResponseEntity<Void> reorderQuestions(
            @PathVariable Long surveyId,
            @RequestBody List<Long> questionIds,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        surveyService.reorderQuestions(surveyId, questionIds, companyId);
        return ResponseEntity.ok().build();
    }
}
