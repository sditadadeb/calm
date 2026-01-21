package com.numia.surveys.dto.survey;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

public class CreateSurveyRequest {
    
    @NotBlank(message = "El título es requerido")
    private String title;
    
    private String description;
    private Boolean allowAnonymous = true;
    private Boolean showProgressBar = true;
    private Boolean allowBackNavigation = true;
    private Boolean randomizeQuestions = false;
    private Boolean oneQuestionPerPage = false;
    private Boolean requireLogin = false;
    private Integer responseLimit = 0;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String logoUrl;
    private String primaryColor;
    private String backgroundColor;
    private String welcomeMessage;
    private String thankYouMessage;
    private String redirectUrl;
    private String customCss;
    private String language = "es";
    private List<CreateQuestionRequest> questions;
    
    public CreateSurveyRequest() {}
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
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
    public List<CreateQuestionRequest> getQuestions() { return questions; }
    public void setQuestions(List<CreateQuestionRequest> questions) { this.questions = questions; }
}
