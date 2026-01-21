package com.numia.surveys.repository;

import com.numia.surveys.model.SurveyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {
    
    Optional<SurveyResponse> findByResponseId(String responseId);
    
    List<SurveyResponse> findBySurveyId(Long surveyId);
    
    Page<SurveyResponse> findBySurveyId(Long surveyId, Pageable pageable);
    
    List<SurveyResponse> findBySurveyIdAndCompletedTrue(Long surveyId);
    
    List<SurveyResponse> findByContactId(Long contactId);
    
    @Query("SELECT COUNT(r) FROM SurveyResponse r WHERE r.survey.id = :surveyId")
    int countBySurveyId(Long surveyId);
    
    @Query("SELECT COUNT(r) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.completed = true")
    int countCompletedBySurveyId(Long surveyId);
    
    @Query("SELECT AVG(r.completionTimeSeconds) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.completed = true")
    Double getAverageCompletionTimeBySurveyId(Long surveyId);
    
    @Query("SELECT r FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.createdAt BETWEEN :start AND :end")
    List<SurveyResponse> findBySurveyIdAndDateRange(Long surveyId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(r) FROM SurveyResponse r WHERE r.survey.company.id = :companyId AND r.createdAt BETWEEN :start AND :end")
    int countByCompanyIdAndDateRange(Long companyId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT r FROM SurveyResponse r WHERE r.ipAddress = :ipAddress AND r.survey.id = :surveyId")
    List<SurveyResponse> findByIpAddressAndSurveyId(String ipAddress, Long surveyId);
    
    // For NPS calculation
    @Query("SELECT a.numericValue FROM Answer a " +
           "JOIN a.surveyResponse r " +
           "WHERE r.survey.id = :surveyId AND a.question.type = 'NPS' AND r.completed = true")
    List<Double> getNpsScoresBySurveyId(Long surveyId);
    
    // Response trends
    @Query("SELECT DATE(r.createdAt), COUNT(r) FROM SurveyResponse r " +
           "WHERE r.survey.id = :surveyId AND r.createdAt BETWEEN :start AND :end " +
           "GROUP BY DATE(r.createdAt) ORDER BY DATE(r.createdAt)")
    List<Object[]> getResponseTrendBySurveyId(Long surveyId, LocalDateTime start, LocalDateTime end);
}

