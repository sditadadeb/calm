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

    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = true AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL)")
    long countSales();

    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL)")
    long countNoSales();
    
    @Query("SELECT COUNT(t) FROM Transcription t WHERE t.analyzed = true AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL)")
    long countAnalyzed();
    
    @Query("SELECT COUNT(t) FROM Transcription t WHERE (t.analyzed = false OR t.analyzed IS NULL) AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL)")
    long countPendingAnalysis();

    @Query("SELECT AVG(t.sellerScore) FROM Transcription t WHERE t.analyzed = true AND t.sellerScore IS NOT NULL AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL)")
    Double averageSellerScore();

    @Query("SELECT DISTINCT t.userId, t.userName FROM Transcription t WHERE t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL")
    List<Object[]> findAllSellers();

    @Query("SELECT DISTINCT t.branchId, t.branchName FROM Transcription t WHERE t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL")
    List<Object[]> findAllBranches();

    @Query("SELECT t.noSaleReason, COUNT(t) FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false AND t.noSaleReason IS NOT NULL AND (t.saleStatus IS NULL OR t.saleStatus <> 'UNINTERPRETABLE') AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL) GROUP BY t.noSaleReason")
    List<Object[]> countByNoSaleReason();

    @Query("SELECT t.userId, t.userName, t.branchName, " +
           "COUNT(t), " +
           "SUM(CASE WHEN t.saleCompleted = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.saleCompleted = false THEN 1 ELSE 0 END), " +
           "AVG(t.sellerScore) " +
           "FROM Transcription t WHERE t.analyzed = true AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL) GROUP BY t.userId, t.userName, t.branchName")
    List<Object[]> getSellerStats();

    @Query("SELECT t.branchId, t.branchName, " +
           "COUNT(t), " +
           "SUM(CASE WHEN t.saleCompleted = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.saleCompleted = false THEN 1 ELSE 0 END), " +
           "AVG(t.sellerScore) " +
           "FROM Transcription t WHERE t.analyzed = true AND (t.branchId NOT IN (4476, 4495, 4496) OR t.branchId IS NULL) GROUP BY t.branchId, t.branchName")
    List<Object[]> getBranchStats();

    boolean existsByRecordingId(String recordingId);

    boolean existsByRecordingIdLike(String pattern);

    // --- Queries nativas: bypassean @SQLRestriction y ven también los excluidos ---

    /** Existe el registro aunque esté excluido (clave para que el sync no re-importe excluidos). */
    @Query(value = "SELECT COUNT(*) FROM transcriptions WHERE recording_id = :recordingId", nativeQuery = true)
    long countAnyByRecordingId(@Param("recordingId") String recordingId);

    default boolean existsAnyByRecordingId(String recordingId) {
        return countAnyByRecordingId(recordingId) > 0;
    }

    @Query(value = "SELECT COUNT(*) FROM transcriptions WHERE recording_id LIKE :pattern", nativeQuery = true)
    long countAnyByRecordingIdLike(@Param("pattern") String pattern);

    @Query(value = "SELECT * FROM transcriptions WHERE excluded = TRUE ORDER BY recording_date DESC", nativeQuery = true)
    List<Transcription> findExcluded();

    @Query(value = "SELECT COUNT(*) FROM transcriptions WHERE excluded = TRUE", nativeQuery = true)
    long countExcluded();

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "UPDATE transcriptions SET excluded = TRUE, updated_at = CURRENT_TIMESTAMP WHERE recording_id = :recordingId", nativeQuery = true)
    int markExcluded(@Param("recordingId") String recordingId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "UPDATE transcriptions SET excluded = FALSE, updated_at = CURRENT_TIMESTAMP WHERE recording_id = :recordingId", nativeQuery = true)
    int markRestored(@Param("recordingId") String recordingId);

    List<Transcription> findByTranscriptionTextStartingWith(String prefix);

    @Query("SELECT t FROM Transcription t WHERE t.recordingDate >= :since AND (" +
           "LOWER(t.noSaleReason) LIKE '%error parseando%' OR " +
           "LOWER(t.executiveSummary) LIKE '%error parseando%')")
    List<Transcription> findParseErrorsSince(@Param("since") LocalDateTime since);
    
    List<Transcription> findByBranchIdIn(java.util.Collection<Long> branchIds);
    
    // Transcripciones analizadas marcadas como "no venta" - para re-análisis
    @Query("SELECT t FROM Transcription t WHERE t.analyzed = true AND t.saleCompleted = false")
    List<Transcription> findAnalyzedNoSales();
    
    // Búsqueda de texto en transcripciones
    @Query("SELECT t FROM Transcription t WHERE " +
           "LOWER(t.transcriptionText) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND " +
           "(:userId IS NULL OR t.userId = :userId) AND " +
           "(:branchId IS NULL OR t.branchId = :branchId) AND " +
           "(:saleCompleted IS NULL OR t.saleCompleted = :saleCompleted) " +
           "ORDER BY t.recordingDate DESC")
    List<Transcription> searchByText(
            @Param("searchTerm") String searchTerm,
            @Param("userId") Long userId,
            @Param("branchId") Long branchId,
            @Param("saleCompleted") Boolean saleCompleted
    );
}

