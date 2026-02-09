package com.calm.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SearchResultDTO {
    
    private String recordingId;
    private String userName;
    private String branchName;
    private LocalDateTime recordingDate;
    private Boolean saleCompleted;
    private String saleStatus;
    private Integer sellerScore;
    private List<String> snippets; // Fragmentos de texto con la palabra buscada
    private int matchCount; // Cantidad de veces que aparece la palabra
    
    public SearchResultDTO() {}
    
    // Getters and Setters
    public String getRecordingId() { return recordingId; }
    public void setRecordingId(String recordingId) { this.recordingId = recordingId; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public LocalDateTime getRecordingDate() { return recordingDate; }
    public void setRecordingDate(LocalDateTime recordingDate) { this.recordingDate = recordingDate; }
    
    public Boolean getSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(Boolean saleCompleted) { this.saleCompleted = saleCompleted; }
    
    public String getSaleStatus() { return saleStatus; }
    public void setSaleStatus(String saleStatus) { this.saleStatus = saleStatus; }
    
    public Integer getSellerScore() { return sellerScore; }
    public void setSellerScore(Integer sellerScore) { this.sellerScore = sellerScore; }
    
    public List<String> getSnippets() { return snippets; }
    public void setSnippets(List<String> snippets) { this.snippets = snippets; }
    
    public int getMatchCount() { return matchCount; }
    public void setMatchCount(int matchCount) { this.matchCount = matchCount; }
}
