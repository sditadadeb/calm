package com.numia.surveys.dto.metrics;

import java.util.List;

public class DashboardMetricsDTO {
    private Integer totalSurveys;
    private Integer activeSurveys;
    private Integer totalResponses;
    private Integer responsesThisMonth;
    private Double averageCompletionRate;
    private Double averageResponseTime;
    private Double overallNps;
    private Integer promoters;
    private Integer passives;
    private Integer detractors;
    private List<DailyResponseCount> responseTrend;
    private List<SurveySummary> topSurveys;
    private List<RecentResponse> recentResponses;
    private Integer totalDistributions;
    private Integer emailsSent;
    private Integer smsSent;
    private Double averageOpenRate;
    private Double averageResponseRate;
    
    public DashboardMetricsDTO() {}
    
    // Getters and Setters
    public Integer getTotalSurveys() { return totalSurveys; }
    public void setTotalSurveys(Integer totalSurveys) { this.totalSurveys = totalSurveys; }
    public Integer getActiveSurveys() { return activeSurveys; }
    public void setActiveSurveys(Integer activeSurveys) { this.activeSurveys = activeSurveys; }
    public Integer getTotalResponses() { return totalResponses; }
    public void setTotalResponses(Integer totalResponses) { this.totalResponses = totalResponses; }
    public Integer getResponsesThisMonth() { return responsesThisMonth; }
    public void setResponsesThisMonth(Integer responsesThisMonth) { this.responsesThisMonth = responsesThisMonth; }
    public Double getAverageCompletionRate() { return averageCompletionRate; }
    public void setAverageCompletionRate(Double averageCompletionRate) { this.averageCompletionRate = averageCompletionRate; }
    public Double getAverageResponseTime() { return averageResponseTime; }
    public void setAverageResponseTime(Double averageResponseTime) { this.averageResponseTime = averageResponseTime; }
    public Double getOverallNps() { return overallNps; }
    public void setOverallNps(Double overallNps) { this.overallNps = overallNps; }
    public Integer getPromoters() { return promoters; }
    public void setPromoters(Integer promoters) { this.promoters = promoters; }
    public Integer getPassives() { return passives; }
    public void setPassives(Integer passives) { this.passives = passives; }
    public Integer getDetractors() { return detractors; }
    public void setDetractors(Integer detractors) { this.detractors = detractors; }
    public List<DailyResponseCount> getResponseTrend() { return responseTrend; }
    public void setResponseTrend(List<DailyResponseCount> responseTrend) { this.responseTrend = responseTrend; }
    public List<SurveySummary> getTopSurveys() { return topSurveys; }
    public void setTopSurveys(List<SurveySummary> topSurveys) { this.topSurveys = topSurveys; }
    public List<RecentResponse> getRecentResponses() { return recentResponses; }
    public void setRecentResponses(List<RecentResponse> recentResponses) { this.recentResponses = recentResponses; }
    public Integer getTotalDistributions() { return totalDistributions; }
    public void setTotalDistributions(Integer totalDistributions) { this.totalDistributions = totalDistributions; }
    public Integer getEmailsSent() { return emailsSent; }
    public void setEmailsSent(Integer emailsSent) { this.emailsSent = emailsSent; }
    public Integer getSmsSent() { return smsSent; }
    public void setSmsSent(Integer smsSent) { this.smsSent = smsSent; }
    public Double getAverageOpenRate() { return averageOpenRate; }
    public void setAverageOpenRate(Double averageOpenRate) { this.averageOpenRate = averageOpenRate; }
    public Double getAverageResponseRate() { return averageResponseRate; }
    public void setAverageResponseRate(Double averageResponseRate) { this.averageResponseRate = averageResponseRate; }
    
    public static class DailyResponseCount {
        private String date;
        private Integer count;
        public DailyResponseCount() {}
        public DailyResponseCount(String date, Integer count) { this.date = date; this.count = count; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public Integer getCount() { return count; }
        public void setCount(Integer count) { this.count = count; }
    }
    
    public static class SurveySummary {
        private Long id;
        private String title;
        private String status;
        private Integer responses;
        private Double completionRate;
        private Double nps;
        public SurveySummary() {}
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getResponses() { return responses; }
        public void setResponses(Integer responses) { this.responses = responses; }
        public Double getCompletionRate() { return completionRate; }
        public void setCompletionRate(Double completionRate) { this.completionRate = completionRate; }
        public Double getNps() { return nps; }
        public void setNps(Double nps) { this.nps = nps; }
    }
    
    public static class RecentResponse {
        private Long surveyId;
        private String surveyTitle;
        private String respondentEmail;
        private Boolean completed;
        private String timestamp;
        public RecentResponse() {}
        public Long getSurveyId() { return surveyId; }
        public void setSurveyId(Long surveyId) { this.surveyId = surveyId; }
        public String getSurveyTitle() { return surveyTitle; }
        public void setSurveyTitle(String surveyTitle) { this.surveyTitle = surveyTitle; }
        public String getRespondentEmail() { return respondentEmail; }
        public void setRespondentEmail(String respondentEmail) { this.respondentEmail = respondentEmail; }
        public Boolean getCompleted() { return completed; }
        public void setCompleted(Boolean completed) { this.completed = completed; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
