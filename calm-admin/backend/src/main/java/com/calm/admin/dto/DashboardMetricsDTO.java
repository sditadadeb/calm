package com.calm.admin.dto;

import java.util.List;
import java.util.Map;

public class DashboardMetricsDTO {
    
    private long totalTranscriptions;
    private long totalSales;
    private long totalNoSales;
    private double conversionRate;
    private double averageSellerScore;
    private List<BranchMetrics> branchMetrics;
    private List<SellerMetrics> sellerMetrics;
    private Map<String, Long> noSaleReasons;
    private Map<String, Long> commonObjections;
    private Map<String, Long> popularProducts;

    public DashboardMetricsDTO() {}

    public long getTotalTranscriptions() { return totalTranscriptions; }
    public void setTotalTranscriptions(long totalTranscriptions) { this.totalTranscriptions = totalTranscriptions; }

    public long getTotalSales() { return totalSales; }
    public void setTotalSales(long totalSales) { this.totalSales = totalSales; }

    public long getTotalNoSales() { return totalNoSales; }
    public void setTotalNoSales(long totalNoSales) { this.totalNoSales = totalNoSales; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

    public double getAverageSellerScore() { return averageSellerScore; }
    public void setAverageSellerScore(double averageSellerScore) { this.averageSellerScore = averageSellerScore; }

    public List<BranchMetrics> getBranchMetrics() { return branchMetrics; }
    public void setBranchMetrics(List<BranchMetrics> branchMetrics) { this.branchMetrics = branchMetrics; }

    public List<SellerMetrics> getSellerMetrics() { return sellerMetrics; }
    public void setSellerMetrics(List<SellerMetrics> sellerMetrics) { this.sellerMetrics = sellerMetrics; }

    public Map<String, Long> getNoSaleReasons() { return noSaleReasons; }
    public void setNoSaleReasons(Map<String, Long> noSaleReasons) { this.noSaleReasons = noSaleReasons; }

    public Map<String, Long> getCommonObjections() { return commonObjections; }
    public void setCommonObjections(Map<String, Long> commonObjections) { this.commonObjections = commonObjections; }

    public Map<String, Long> getPopularProducts() { return popularProducts; }
    public void setPopularProducts(Map<String, Long> popularProducts) { this.popularProducts = popularProducts; }

    public static class BranchMetrics {
        private Long branchId;
        private String branchName;
        private long totalInteractions;
        private long sales;
        private long noSales;
        private double conversionRate;
        private double averageScore;

        public BranchMetrics() {}

        public Long getBranchId() { return branchId; }
        public void setBranchId(Long branchId) { this.branchId = branchId; }

        public String getBranchName() { return branchName; }
        public void setBranchName(String branchName) { this.branchName = branchName; }

        public long getTotalInteractions() { return totalInteractions; }
        public void setTotalInteractions(long totalInteractions) { this.totalInteractions = totalInteractions; }

        public long getSales() { return sales; }
        public void setSales(long sales) { this.sales = sales; }

        public long getNoSales() { return noSales; }
        public void setNoSales(long noSales) { this.noSales = noSales; }

        public double getConversionRate() { return conversionRate; }
        public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
    }
    
    public static class SellerMetrics {
        private Long userId;
        private String userName;
        private String branchName;
        private long totalInteractions;
        private long sales;
        private long noSales;
        private double conversionRate;
        private double averageScore;
        private List<String> topStrengths;
        private List<String> areasToImprove;

        public SellerMetrics() {}

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public String getBranchName() { return branchName; }
        public void setBranchName(String branchName) { this.branchName = branchName; }

        public long getTotalInteractions() { return totalInteractions; }
        public void setTotalInteractions(long totalInteractions) { this.totalInteractions = totalInteractions; }

        public long getSales() { return sales; }
        public void setSales(long sales) { this.sales = sales; }

        public long getNoSales() { return noSales; }
        public void setNoSales(long noSales) { this.noSales = noSales; }

        public double getConversionRate() { return conversionRate; }
        public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

        public double getAverageScore() { return averageScore; }
        public void setAverageScore(double averageScore) { this.averageScore = averageScore; }

        public List<String> getTopStrengths() { return topStrengths; }
        public void setTopStrengths(List<String> topStrengths) { this.topStrengths = topStrengths; }

        public List<String> getAreasToImprove() { return areasToImprove; }
        public void setAreasToImprove(List<String> areasToImprove) { this.areasToImprove = areasToImprove; }
    }
}
