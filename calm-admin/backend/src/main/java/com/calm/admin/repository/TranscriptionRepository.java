package com.calm.admin.repository;

import com.calm.admin.model.Transcription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TranscriptionRepository extends JpaRepository<Transcription, String> {

    List<Transcription> findByAnalyzedFalse();
    
    List<Transcription> findByUserId(Long userId);
    
    List<Transcription> findByBranchId(Long branchId);
    
    List<Transcription> findBySaleCompleted(Boolean saleCompleted);
    
    @Query("SELECT t FROM Transcription t WHERE " +
           "(:userId IS NULL OR t.userId = :userId) AND " +
           "(:branchId IS NULL OR t.branchId = :branchId) AND " +
           "(:saleCompleted IS NULL OR t.saleCompleted = :saleCompleted) AND " +
           "(:dateFrom IS NULL OR t.recordingDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR t.recordingDate <= :dateTo) AND " +
           "(:minScore IS NULL OR t.sellerScore >= :minScore) AND " +
           "(:maxScore IS NULL OR t.sellerScore <= :maxScore) " +
           "ORDER BY t.recordingDate DESC")
    List<Transcription> findWithFilters(
            @Param("userId") Long userId,
            @Param("branchId") Long branchId,
            @Param("saleCompleted") Boolean saleCompleted,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("minScore") Integer minScore,
            @Param("maxScore") Integer maxScore
    );

    // Solo cuenta transcripciones ANALIZADAS con venta confirmada
    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = true")
    long countSales();

    // Solo cuenta transcripciones ANALIZADAS sin venta
    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false")
    long countNoSales();
    
    // Cuenta transcripciones analizadas
    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true")
    long countAnalyzed();
    
    // Cuenta transcripciones pendientes de análisis
    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = false OR t.analyzed IS NULL")
    long countPendingAnalysis();

    @Query("SELECT AVG(t.sellerScore) FROM Transcription t WHERE t.analyzed = true AND t.sellerScore IS NOT NULL")
    Double averageSellerScore();

    @Query("SELECT DISTINCT t.userId, t.userName FROM Transcription t")
    List<Object[]> findAllSellers();

    @Query("SELECT DISTINCT t.branchId, t.branchName FROM Transcription t")
    List<Object[]> findAllBranches();

    @Query("SELECT t.noSaleReason, COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false AND t.noSaleReason IS NOT NULL GROUP BY t.noSaleReason")
    List<Object[]> countByNoSaleReason();

    // Solo estadísticas de transcripciones ANALIZADAS
    @Query("SELECT t.userId, t.userName, t.branchName, " +
           "COUNT(t), " +
           "SUM(CASE WHEN t.saleCompleted = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.saleCompleted = false THEN 1 ELSE 0 END), " +
           "AVG(t.sellerScore) " +
           "FROM Transcription t WHERE t.analyzed = true GROUP BY t.userId, t.userName, t.branchName")
    List<Object[]> getSellerStats();

    // Solo estadísticas de transcripciones ANALIZADAS
    @Query("SELECT t.branchId, t.branchName, " +
           "COUNT(t), " +
           "SUM(CASE WHEN t.saleCompleted = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.saleCompleted = false THEN 1 ELSE 0 END), " +
           "AVG(t.sellerScore) " +
           "FROM Transcription t WHERE t.analyzed = true GROUP BY t.branchId, t.branchName")
    List<Object[]> getBranchStats();

    boolean existsByRecordingId(String recordingId);
    
    // Transcripciones analizadas marcadas como "no venta" - para re-análisis
    @Query("SELECT t FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false")
    List<Transcription> findAnalyzedNoSales();
}

