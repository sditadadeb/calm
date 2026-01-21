package com.numia.surveys.repository;

import com.numia.surveys.model.Survey;
import com.numia.surveys.model.enums.SurveyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {
    
    Optional<Survey> findByPublicId(String publicId);
    
    List<Survey> findByCompanyId(Long companyId);
    
    Page<Survey> findByCompanyId(Long companyId, Pageable pageable);
    
    List<Survey> findByCompanyIdAndStatus(Long companyId, SurveyStatus status);
    
    List<Survey> findByCreatedById(Long userId);
    
    @Query("SELECT s FROM Survey s WHERE s.company.id = :companyId ORDER BY s.updatedAt DESC")
    List<Survey> findByCompanyIdOrderByUpdatedAtDesc(Long companyId);
    
    @Query("SELECT s FROM Survey s WHERE s.status = :status AND s.endDate < :now")
    List<Survey> findExpiredSurveys(SurveyStatus status, LocalDateTime now);
    
    @Query("SELECT s FROM Survey s WHERE s.company.id = :companyId AND " +
           "(LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Survey> searchByCompanyId(Long companyId, String search);
    
    @Query("SELECT COUNT(s) FROM Survey s WHERE s.company.id = :companyId")
    int countByCompanyId(Long companyId);
    
    @Query("SELECT COUNT(s) FROM Survey s WHERE s.company.id = :companyId AND s.status = :status")
    int countByCompanyIdAndStatus(Long companyId, SurveyStatus status);
    
    @Query("SELECT s FROM Survey s WHERE s.status = 'ACTIVE' AND " +
           "(s.endDate IS NULL OR s.endDate > :now)")
    List<Survey> findActiveSurveys(LocalDateTime now);
}

