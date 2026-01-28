package com.calm.admin.repository;

import com.calm.admin.model.AdvancedAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdvancedAnalysisRepository extends JpaRepository<AdvancedAnalysis, Long> {
    
    Optional<AdvancedAnalysis> findByRecordingId(String recordingId);
    
    boolean existsByRecordingId(String recordingId);
    
    @Query("SELECT a FROM AdvancedAnalysis a WHERE a.recordingId IN :recordingIds")
    List<AdvancedAnalysis> findByRecordingIds(List<String> recordingIds);
    
    @Query("SELECT COUNT(a) FROM AdvancedAnalysis a")
    long countAnalyzed();
}
