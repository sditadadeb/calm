package com.calm.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TranscriptionDTO {
    
    private String recordingId;
    private Long userId;
    private String userName;
    private Long branchId;
    private String branchName;
    private String transcriptionText;
    private Boolean saleCompleted;
    private String saleStatus;
    private Integer analysisConfidence;
    private String saleEvidence;
    private String noSaleReason;
    private List<String> productsDiscussed;
    private List<String> customerObjections;
    private List<String> improvementSuggestions;
    private String executiveSummary;
    private Integer sellerScore;
    private List<String> sellerStrengths;
    private List<String> sellerWeaknesses;
    private LocalDateTime recordingDate;
    private LocalDateTime analyzedAt;
    private Boolean analyzed;

    public TranscriptionDTO() {}

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

    public String getSaleEvidence() { return saleEvidence; }
    public void setSaleEvidence(String saleEvidence) { this.saleEvidence = saleEvidence; }

    public String getNoSaleReason() { return noSaleReason; }
    public void setNoSaleReason(String noSaleReason) { this.noSaleReason = noSaleReason; }

    public List<String> getProductsDiscussed() { return productsDiscussed; }
    public void setProductsDiscussed(List<String> productsDiscussed) { this.productsDiscussed = productsDiscussed; }

    public List<String> getCustomerObjections() { return customerObjections; }
    public void setCustomerObjections(List<String> customerObjections) { this.customerObjections = customerObjections; }

    public List<String> getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(List<String> improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }

    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }

    public Integer getSellerScore() { return sellerScore; }
    public void setSellerScore(Integer sellerScore) { this.sellerScore = sellerScore; }

    public List<String> getSellerStrengths() { return sellerStrengths; }
    public void setSellerStrengths(List<String> sellerStrengths) { this.sellerStrengths = sellerStrengths; }

    public List<String> getSellerWeaknesses() { return sellerWeaknesses; }
    public void setSellerWeaknesses(List<String> sellerWeaknesses) { this.sellerWeaknesses = sellerWeaknesses; }

    public LocalDateTime getRecordingDate() { return recordingDate; }
    public void setRecordingDate(LocalDateTime recordingDate) { this.recordingDate = recordingDate; }

    public LocalDateTime getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(LocalDateTime analyzedAt) { this.analyzedAt = analyzedAt; }

    public Boolean getAnalyzed() { return analyzed; }
    public void setAnalyzed(Boolean analyzed) { this.analyzed = analyzed; }
}
