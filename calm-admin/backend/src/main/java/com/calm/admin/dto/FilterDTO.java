package com.calm.admin.dto;

import java.time.LocalDate;

public class FilterDTO {
    
    private Long userId;
    private Long branchId;
    private Boolean saleCompleted;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private Integer minScore;
    private Integer maxScore;
    private String searchText;

    public FilterDTO() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public Boolean getSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(Boolean saleCompleted) { this.saleCompleted = saleCompleted; }

    public LocalDate getDateFrom() { return dateFrom; }
    public void setDateFrom(LocalDate dateFrom) { this.dateFrom = dateFrom; }

    public LocalDate getDateTo() { return dateTo; }
    public void setDateTo(LocalDate dateTo) { this.dateTo = dateTo; }

    public Integer getMinScore() { return minScore; }
    public void setMinScore(Integer minScore) { this.minScore = minScore; }

    public Integer getMaxScore() { return maxScore; }
    public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }

    public String getSearchText() { return searchText; }
    public void setSearchText(String searchText) { this.searchText = searchText; }
}
