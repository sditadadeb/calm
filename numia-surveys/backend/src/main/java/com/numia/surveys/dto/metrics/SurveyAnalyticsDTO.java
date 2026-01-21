package com.numia.surveys.dto.metrics;

import java.util.List;
import java.util.Map;

public class SurveyAnalyticsDTO {
    private Long surveyId;
    private String surveyTitle;
    private Integer totalResponses;
    private Integer completedResponses;
    private Integer partialResponses;
    private Double completionRate;
    private Double averageCompletionTime;
    private Double npsScore;
    private Integer promoters;
    private Integer passives;
    private Integer detractors;
    private Double csatScore;
    private Map<Integer, Integer> csatDistribution;
    private Double cesScore;
    private List<DashboardMetricsDTO.DailyResponseCount> responseTrend;
    private List<QuestionAnalytics> questionAnalytics;
    private List<DistributionPerformance> distributionPerformance;
    
    public SurveyAnalyticsDTO() {}
    
    // Getters and Setters
    public Long getSurveyId() { return surveyId; }
    public void setSurveyId(Long surveyId) { this.surveyId = surveyId; }
    public String getSurveyTitle() { return surveyTitle; }
    public void setSurveyTitle(String surveyTitle) { this.surveyTitle = surveyTitle; }
    public Integer getTotalResponses() { return totalResponses; }
    public void setTotalResponses(Integer totalResponses) { this.totalResponses = totalResponses; }
    public Integer getCompletedResponses() { return completedResponses; }
    public void setCompletedResponses(Integer completedResponses) { this.completedResponses = completedResponses; }
    public Integer getPartialResponses() { return partialResponses; }
    public void setPartialResponses(Integer partialResponses) { this.partialResponses = partialResponses; }
    public Double getCompletionRate() { return completionRate; }
    public void setCompletionRate(Double completionRate) { this.completionRate = completionRate; }
    public Double getAverageCompletionTime() { return averageCompletionTime; }
    public void setAverageCompletionTime(Double averageCompletionTime) { this.averageCompletionTime = averageCompletionTime; }
    public Double getNpsScore() { return npsScore; }
    public void setNpsScore(Double npsScore) { this.npsScore = npsScore; }
    public Integer getPromoters() { return promoters; }
    public void setPromoters(Integer promoters) { this.promoters = promoters; }
    public Integer getPassives() { return passives; }
    public void setPassives(Integer passives) { this.passives = passives; }
    public Integer getDetractors() { return detractors; }
    public void setDetractors(Integer detractors) { this.detractors = detractors; }
    public Double getCsatScore() { return csatScore; }
    public void setCsatScore(Double csatScore) { this.csatScore = csatScore; }
    public Map<Integer, Integer> getCsatDistribution() { return csatDistribution; }
    public void setCsatDistribution(Map<Integer, Integer> csatDistribution) { this.csatDistribution = csatDistribution; }
    public Double getCesScore() { return cesScore; }
    public void setCesScore(Double cesScore) { this.cesScore = cesScore; }
    public List<DashboardMetricsDTO.DailyResponseCount> getResponseTrend() { return responseTrend; }
    public void setResponseTrend(List<DashboardMetricsDTO.DailyResponseCount> responseTrend) { this.responseTrend = responseTrend; }
    public List<QuestionAnalytics> getQuestionAnalytics() { return questionAnalytics; }
    public void setQuestionAnalytics(List<QuestionAnalytics> questionAnalytics) { this.questionAnalytics = questionAnalytics; }
    public List<DistributionPerformance> getDistributionPerformance() { return distributionPerformance; }
    public void setDistributionPerformance(List<DistributionPerformance> distributionPerformance) { this.distributionPerformance = distributionPerformance; }
    
    public static class QuestionAnalytics {
        private Long questionId;
        private String questionText;
        private String questionType;
        private Integer responseCount;
        private Double averageRating;
        private Double minRating;
        private Double maxRating;
        private Map<String, Integer> ratingDistribution;
        private Map<String, Integer> optionCounts;
        private Map<String, Double> optionPercentages;
        private List<String> sampleResponses;
        private Integer totalTextResponses;
        
        public QuestionAnalytics() {}
        
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }
        public String getQuestionType() { return questionType; }
        public void setQuestionType(String questionType) { this.questionType = questionType; }
        public Integer getResponseCount() { return responseCount; }
        public void setResponseCount(Integer responseCount) { this.responseCount = responseCount; }
        public Double getAverageRating() { return averageRating; }
        public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
        public Double getMinRating() { return minRating; }
        public void setMinRating(Double minRating) { this.minRating = minRating; }
        public Double getMaxRating() { return maxRating; }
        public void setMaxRating(Double maxRating) { this.maxRating = maxRating; }
        public Map<String, Integer> getRatingDistribution() { return ratingDistribution; }
        public void setRatingDistribution(Map<String, Integer> ratingDistribution) { this.ratingDistribution = ratingDistribution; }
        public Map<String, Integer> getOptionCounts() { return optionCounts; }
        public void setOptionCounts(Map<String, Integer> optionCounts) { this.optionCounts = optionCounts; }
        public Map<String, Double> getOptionPercentages() { return optionPercentages; }
        public void setOptionPercentages(Map<String, Double> optionPercentages) { this.optionPercentages = optionPercentages; }
        public List<String> getSampleResponses() { return sampleResponses; }
        public void setSampleResponses(List<String> sampleResponses) { this.sampleResponses = sampleResponses; }
        public Integer getTotalTextResponses() { return totalTextResponses; }
        public void setTotalTextResponses(Integer totalTextResponses) { this.totalTextResponses = totalTextResponses; }
    }
    
    public static class DistributionPerformance {
        private Long distributionId;
        private String name;
        private String channel;
        private Integer sent;
        private Integer delivered;
        private Integer opened;
        private Integer responded;
        private Double deliveryRate;
        private Double openRate;
        private Double responseRate;
        
        public DistributionPerformance() {}
        
        public Long getDistributionId() { return distributionId; }
        public void setDistributionId(Long distributionId) { this.distributionId = distributionId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public Integer getSent() { return sent; }
        public void setSent(Integer sent) { this.sent = sent; }
        public Integer getDelivered() { return delivered; }
        public void setDelivered(Integer delivered) { this.delivered = delivered; }
        public Integer getOpened() { return opened; }
        public void setOpened(Integer opened) { this.opened = opened; }
        public Integer getResponded() { return responded; }
        public void setResponded(Integer responded) { this.responded = responded; }
        public Double getDeliveryRate() { return deliveryRate; }
        public void setDeliveryRate(Double deliveryRate) { this.deliveryRate = deliveryRate; }
        public Double getOpenRate() { return openRate; }
        public void setOpenRate(Double openRate) { this.openRate = openRate; }
        public Double getResponseRate() { return responseRate; }
        public void setResponseRate(Double responseRate) { this.responseRate = responseRate; }
    }
}
