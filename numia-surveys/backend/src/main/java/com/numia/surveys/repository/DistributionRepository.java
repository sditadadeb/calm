package com.numia.surveys.repository;

import com.numia.surveys.model.Distribution;
import com.numia.surveys.model.enums.DistributionChannel;
import com.numia.surveys.model.enums.DistributionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DistributionRepository extends JpaRepository<Distribution, Long> {
    
    List<Distribution> findBySurveyId(Long surveyId);
    
    List<Distribution> findBySurveyIdOrderByCreatedAtDesc(Long surveyId);
    
    List<Distribution> findByStatus(DistributionStatus status);
    
    List<Distribution> findByChannel(DistributionChannel channel);
    
    @Query("SELECT d FROM Distribution d WHERE d.status = 'PENDING' AND d.scheduledAt <= :now")
    List<Distribution> findScheduledDistributionsToSend(LocalDateTime now);
    
    @Query("SELECT d FROM Distribution d WHERE d.survey.company.id = :companyId ORDER BY d.createdAt DESC")
    List<Distribution> findByCompanyId(Long companyId);
    
    @Query("SELECT COUNT(d) FROM Distribution d WHERE d.survey.id = :surveyId")
    int countBySurveyId(Long surveyId);
    
    @Query("SELECT SUM(d.sentCount) FROM Distribution d WHERE d.survey.id = :surveyId")
    Integer getTotalSentBySurveyId(Long surveyId);
}

