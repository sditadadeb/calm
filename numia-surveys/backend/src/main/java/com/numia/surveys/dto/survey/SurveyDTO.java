package com.numia.surveys.dto.survey;

import com.numia.surveys.model.Survey;
import com.numia.surveys.model.enums.SurveyStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SurveyDTO {
    private Long id;
    private String publicId;
    private String title;
    private String description;
    private SurveyStatus status;
    private Boolean allowAnonymous;
    private Boolean showProgressBar;
    private Boolean allowBackNavigation;
    private Boolean randomizeQuestions;
    private Boolean oneQuestionPerPage;
    private Boolean requireLogin;
    private Integer responseLimit;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String logoUrl;
    private String primaryColor;
    private String backgroundColor;
    private String welcomeMessage;
    private String thankYouMessage;
    private String redirectUrl;
    private String customCss;
    private String language;
    private Integer totalResponses;
    private Integer completedResponses;
    private Double averageCompletionTime;
    private Double completionRate;
    private Integer questionCount;
    private List<QuestionDTO> questions;
    private Long companyId;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime closedAt;
    private String surveyUrl;
    
    public SurveyDTO() {}
    
    public static SurveyDTO fromEntity(Survey survey) {
        return fromEntity(survey, false);
    }
    
    public static SurveyDTO fromEntity(Survey survey, boolean includeQuestions) {
        SurveyDTO dto = new SurveyDTO();
        dto.id = survey.getId();
        dto.publicId = survey.getPublicId();
        dto.title = survey.getTitle();
        dto.description = survey.getDescription();
        dto.status = survey.getStatus();
        dto.allowAnonymous = survey.getAllowAnonymous();
        dto.showProgressBar = survey.getShowProgressBar();
        dto.allowBackNavigation = survey.getAllowBackNavigation();
        dto.randomizeQuestions = survey.getRandomizeQuestions();
        dto.oneQuestionPerPage = survey.getOneQuestionPerPage();
        dto.requireLogin = survey.getRequireLogin();
        dto.responseLimit = survey.getResponseLimit();
        dto.startDate = survey.getStartDate();
        dto.endDate = survey.getEndDate();
        dto.logoUrl = survey.getLogoUrl();
        dto.primaryColor = survey.getPrimaryColor();
        dto.backgroundColor = survey.getBackgroundColor();
        dto.welcomeMessage = survey.getWelcomeMessage();
        dto.thankYouMessage = survey.getThankYouMessage();
        dto.redirectUrl = survey.getRedirectUrl();
        dto.customCss = survey.getCustomCss();
        dto.language = survey.getLanguage();
        dto.totalResponses = survey.getTotalResponses();
        dto.completedResponses = survey.getCompletedResponses();
        dto.averageCompletionTime = survey.getAverageCompletionTime();
        dto.completionRate = survey.getCompletionRate();
        dto.questionCount = survey.getQuestions() != null ? survey.getQuestions().size() : 0;
        dto.companyId = survey.getCompany() != null ? survey.getCompany().getId() : null;
        dto.createdByName = survey.getCreatedBy() != null ? survey.getCreatedBy().getFullName() : null;
        dto.createdAt = survey.getCreatedAt();
        dto.updatedAt = survey.getUpdatedAt();
        dto.publishedAt = survey.getPublishedAt();
        dto.closedAt = survey.getClosedAt();
        if (includeQuestions && survey.getQuestions() != null) {
            dto.questions = survey.getQuestions().stream().map(QuestionDTO::fromEntity).collect(Collectors.toList());
        }
        return dto;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public SurveyStatus getStatus() { return status; }
    public void setStatus(SurveyStatus status) { this.status = status; }
    public Boolean getAllowAnonymous() { return allowAnonymous; }
    public void setAllowAnonymous(Boolean allowAnonymous) { this.allowAnonymous = allowAnonymous; }
    public Boolean getShowProgressBar() { return showProgressBar; }
    public void setShowProgressBar(Boolean showProgressBar) { this.showProgressBar = showProgressBar; }
    public Boolean getAllowBackNavigation() { return allowBackNavigation; }
    public void setAllowBackNavigation(Boolean allowBackNavigation) { this.allowBackNavigation = allowBackNavigation; }
    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }
    public Boolean getOneQuestionPerPage() { return oneQuestionPerPage; }
    public void setOneQuestionPerPage(Boolean oneQuestionPerPage) { this.oneQuestionPerPage = oneQuestionPerPage; }
    public Boolean getRequireLogin() { return requireLogin; }
    public void setRequireLogin(Boolean requireLogin) { this.requireLogin = requireLogin; }
    public Integer getResponseLimit() { return responseLimit; }
    public void setResponseLimit(Integer responseLimit) { this.responseLimit = responseLimit; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
    public String getBackgroundColor() { return backgroundColor; }
    public void setBackgroundColor(String backgroundColor) { this.backgroundColor = backgroundColor; }
    public String getWelcomeMessage() { return welcomeMessage; }
    public void setWelcomeMessage(String welcomeMessage) { this.welcomeMessage = welcomeMessage; }
    public String getThankYouMessage() { return thankYouMessage; }
    public void setThankYouMessage(String thankYouMessage) { this.thankYouMessage = thankYouMessage; }
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
    public String getCustomCss() { return customCss; }
    public void setCustomCss(String customCss) { this.customCss = customCss; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Integer getTotalResponses() { return totalResponses; }
    public void setTotalResponses(Integer totalResponses) { this.totalResponses = totalResponses; }
    public Integer getCompletedResponses() { return completedResponses; }
    public void setCompletedResponses(Integer completedResponses) { this.completedResponses = completedResponses; }
    public Double getAverageCompletionTime() { return averageCompletionTime; }
    public void setAverageCompletionTime(Double averageCompletionTime) { this.averageCompletionTime = averageCompletionTime; }
    public Double getCompletionRate() { return completionRate; }
    public void setCompletionRate(Double completionRate) { this.completionRate = completionRate; }
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public List<QuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDTO> questions) { this.questions = questions; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public String getSurveyUrl() { return surveyUrl; }
    public void setSurveyUrl(String surveyUrl) { this.surveyUrl = surveyUrl; }
}
