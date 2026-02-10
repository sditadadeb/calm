package com.calm.admin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transcriptions")
public class Transcription {

    @Id
    private String recordingId;
    private Long userId;
    private String userName;
    private Long branchId;
    private String branchName;

    @Column(columnDefinition = "TEXT")
    private String transcriptionText;

    private Boolean saleCompleted;
    
    // Nuevo: Estado detallado de la venta
    // SALE_CONFIRMED, SALE_LIKELY, ADVANCE_NO_CLOSE, NO_SALE, UNINTERPRETABLE
    private String saleStatus;
    
    // Nuevo: Confianza del análisis (0-100)
    private Integer analysisConfidence;
    
    // Nuevo: Trazabilidad del cálculo de confianza (JSON)
    @Column(columnDefinition = "TEXT")
    private String confidenceTrace;
    
    @Column(columnDefinition = "TEXT")
    private String saleEvidence; // Evidencia que confirma/descarta la venta
    
    @Column(columnDefinition = "TEXT")
    private String noSaleReason;
    
    @Column(columnDefinition = "TEXT")
    private String productsDiscussed;
    
    @Column(columnDefinition = "TEXT")
    private String customerObjections;
    
    @Column(columnDefinition = "TEXT")
    private String improvementSuggestions;
    
    @Column(columnDefinition = "TEXT")
    private String executiveSummary;
    
    private Integer sellerScore;
    
    @Column(columnDefinition = "TEXT")
    private String sellerStrengths;
    
    @Column(columnDefinition = "TEXT")
    private String sellerWeaknesses;

    private LocalDateTime recordingDate;
    private LocalDateTime analyzedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean analyzed;

    public Transcription() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (analyzed == null) analyzed = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getRecordingId() { return recordingId; }
    public void setRecordingId(String recordingId) { this.recordingId = recordingId; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public String getTranscriptionText() { return transcriptionText; }
    public void setTranscriptionText(String transcriptionText) { this.transcriptionText = transcriptionText; }
    
    public Boolean getSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(Boolean saleCompleted) { this.saleCompleted = saleCompleted; }
    
    public String getSaleStatus() { return saleStatus; }
    public void setSaleStatus(String saleStatus) { this.saleStatus = saleStatus; }
    
    public Integer getAnalysisConfidence() { return analysisConfidence; }
    public void setAnalysisConfidence(Integer analysisConfidence) { this.analysisConfidence = analysisConfidence; }
    
    public String getConfidenceTrace() { return confidenceTrace; }
    public void setConfidenceTrace(String confidenceTrace) { this.confidenceTrace = confidenceTrace; }
    
    public String getSaleEvidence() { return saleEvidence; }
    public void setSaleEvidence(String saleEvidence) { this.saleEvidence = saleEvidence; }
    
    public String getNoSaleReason() { return noSaleReason; }
    public void setNoSaleReason(String noSaleReason) { this.noSaleReason = noSaleReason; }
    
    public String getProductsDiscussed() { return productsDiscussed; }
    public void setProductsDiscussed(String productsDiscussed) { this.productsDiscussed = productsDiscussed; }
    
    public String getCustomerObjections() { return customerObjections; }
    public void setCustomerObjections(String customerObjections) { this.customerObjections = customerObjections; }
    
    public String getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(String improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }
    
    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
    
    public Integer getSellerScore() { return sellerScore; }
    public void setSellerScore(Integer sellerScore) { this.sellerScore = sellerScore; }
    
    public String getSellerStrengths() { return sellerStrengths; }
    public void setSellerStrengths(String sellerStrengths) { this.sellerStrengths = sellerStrengths; }
    
    public String getSellerWeaknesses() { return sellerWeaknesses; }
    public void setSellerWeaknesses(String sellerWeaknesses) { this.sellerWeaknesses = sellerWeaknesses; }
    
    public LocalDateTime getRecordingDate() { return recordingDate; }
    public void setRecordingDate(LocalDateTime recordingDate) { this.recordingDate = recordingDate; }
    
    public LocalDateTime getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(LocalDateTime analyzedAt) { this.analyzedAt = analyzedAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Boolean getAnalyzed() { return analyzed; }
    public void setAnalyzed(Boolean analyzed) { this.analyzed = analyzed; }
}
