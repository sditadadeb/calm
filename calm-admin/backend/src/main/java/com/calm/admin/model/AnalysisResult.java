package com.calm.admin.model;

import java.util.List;

public class AnalysisResult {
    
    private boolean saleCompleted;
    private String saleStatus; // SALE_CONFIRMED, SALE_LIKELY, ADVANCE_NO_CLOSE, NO_SALE, UNINTERPRETABLE
    private int analysisConfidence; // 0-100
    private String confidenceTrace; // JSON con trazabilidad del cálculo
    private String saleEvidence; // Evidencia que confirma/descarta la venta
    private String saleEvidenceMeta; // JSON con metadata de evidencia de venta
    private String noSaleReason;
    private List<String> productsDiscussed;
    private List<String> customerObjections;
    private List<String> improvementSuggestions;
    private String executiveSummary;
    private int sellerScore;
    private List<String> sellerStrengths;
    private List<String> sellerWeaknesses;
    private String followUpRecommendation;

    public AnalysisResult() {}

    public boolean isSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(boolean saleCompleted) { this.saleCompleted = saleCompleted; }

    public String getSaleStatus() { return saleStatus; }
    public void setSaleStatus(String saleStatus) { this.saleStatus = saleStatus; }

    public int getAnalysisConfidence() { return analysisConfidence; }
    public void setAnalysisConfidence(int analysisConfidence) { this.analysisConfidence = analysisConfidence; }

    public String getConfidenceTrace() { return confidenceTrace; }
    public void setConfidenceTrace(String confidenceTrace) { this.confidenceTrace = confidenceTrace; }

    public String getSaleEvidence() { return saleEvidence; }
    public void setSaleEvidence(String saleEvidence) { this.saleEvidence = saleEvidence; }

    public String getSaleEvidenceMeta() { return saleEvidenceMeta; }
    public void setSaleEvidenceMeta(String saleEvidenceMeta) { this.saleEvidenceMeta = saleEvidenceMeta; }

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

    public int getSellerScore() { return sellerScore; }
    public void setSellerScore(int sellerScore) { this.sellerScore = sellerScore; }

    public List<String> getSellerStrengths() { return sellerStrengths; }
    public void setSellerStrengths(List<String> sellerStrengths) { this.sellerStrengths = sellerStrengths; }

    public List<String> getSellerWeaknesses() { return sellerWeaknesses; }
    public void setSellerWeaknesses(List<String> sellerWeaknesses) { this.sellerWeaknesses = sellerWeaknesses; }

    public String getFollowUpRecommendation() { return followUpRecommendation; }
    public void setFollowUpRecommendation(String followUpRecommendation) { this.followUpRecommendation = followUpRecommendation; }
}
