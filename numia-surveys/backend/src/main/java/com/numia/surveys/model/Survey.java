package com.numia.surveys.model;

import com.numia.surveys.model.enums.SurveyStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "surveys")
public class Survey {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String publicId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SurveyStatus status = SurveyStatus.DRAFT;
    
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
    
    @Column(columnDefinition = "TEXT")
    private String welcomeMessage;
    
    @Column(columnDefinition = "TEXT")
    private String thankYouMessage;
    
    private String redirectUrl;
    
    @Column(columnDefinition = "TEXT")
    private String customCss;
    
    private String language = "es";
    
    private Integer totalResponses = 0;
    private Integer completedResponses = 0;
    private Double averageCompletionTime;
    private Double completionRate;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    private LocalDateTime publishedAt;
    private LocalDateTime closedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Question> questions = new ArrayList<>();
    
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL)
    private List<SurveyResponse> responses = new ArrayList<>();
    
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL)
    private List<Distribution> distributions = new ArrayList<>();
    
    public Survey() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (publicId == null || publicId.isEmpty()) {
            publicId = UUID.randomUUID().toString().substring(0, 8);
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void publish() {
        this.status = SurveyStatus.ACTIVE;
        this.publishedAt = LocalDateTime.now();
    }
    
    public void close() {
        this.status = SurveyStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
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
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
    
    public List<SurveyResponse> getResponses() { return responses; }
    public void setResponses(List<SurveyResponse> responses) { this.responses = responses; }
    
    public List<Distribution> getDistributions() { return distributions; }
    public void setDistributions(List<Distribution> distributions) { this.distributions = distributions; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Survey survey = (Survey) o;
        return Objects.equals(id, survey.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Survey{id=" + id + ", title='" + title + "', publicId='" + publicId + "'}";
    }
    
    // Builder
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String publicId;
        private String title;
        private String description;
        private SurveyStatus status = SurveyStatus.DRAFT;
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
        private Integer totalResponses = 0;
        private Integer completedResponses = 0;
        private Double averageCompletionTime;
        private Double completionRate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime publishedAt;
        private LocalDateTime closedAt;
        private Company company;
        private User createdBy;
        private List<Question> questions = new ArrayList<>();
        private List<SurveyResponse> responses = new ArrayList<>();
        private List<Distribution> distributions = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder publicId(String publicId) { this.publicId = publicId; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(SurveyStatus status) { this.status = status; return this; }
        public Builder allowAnonymous(Boolean allowAnonymous) { this.allowAnonymous = allowAnonymous; return this; }
        public Builder showProgressBar(Boolean showProgressBar) { this.showProgressBar = showProgressBar; return this; }
        public Builder allowBackNavigation(Boolean allowBackNavigation) { this.allowBackNavigation = allowBackNavigation; return this; }
        public Builder randomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; return this; }
        public Builder oneQuestionPerPage(Boolean oneQuestionPerPage) { this.oneQuestionPerPage = oneQuestionPerPage; return this; }
        public Builder requireLogin(Boolean requireLogin) { this.requireLogin = requireLogin; return this; }
        public Builder responseLimit(Integer responseLimit) { this.responseLimit = responseLimit; return this; }
        public Builder startDate(LocalDateTime startDate) { this.startDate = startDate; return this; }
        public Builder endDate(LocalDateTime endDate) { this.endDate = endDate; return this; }
        public Builder logoUrl(String logoUrl) { this.logoUrl = logoUrl; return this; }
        public Builder primaryColor(String primaryColor) { this.primaryColor = primaryColor; return this; }
        public Builder backgroundColor(String backgroundColor) { this.backgroundColor = backgroundColor; return this; }
        public Builder welcomeMessage(String welcomeMessage) { this.welcomeMessage = welcomeMessage; return this; }
        public Builder thankYouMessage(String thankYouMessage) { this.thankYouMessage = thankYouMessage; return this; }
        public Builder redirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; return this; }
        public Builder customCss(String customCss) { this.customCss = customCss; return this; }
        public Builder language(String language) { this.language = language; return this; }
        public Builder totalResponses(Integer totalResponses) { this.totalResponses = totalResponses; return this; }
        public Builder completedResponses(Integer completedResponses) { this.completedResponses = completedResponses; return this; }
        public Builder averageCompletionTime(Double averageCompletionTime) { this.averageCompletionTime = averageCompletionTime; return this; }
        public Builder completionRate(Double completionRate) { this.completionRate = completionRate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder publishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; return this; }
        public Builder closedAt(LocalDateTime closedAt) { this.closedAt = closedAt; return this; }
        public Builder company(Company company) { this.company = company; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public Builder questions(List<Question> questions) { this.questions = questions; return this; }
        public Builder responses(List<SurveyResponse> responses) { this.responses = responses; return this; }
        public Builder distributions(List<Distribution> distributions) { this.distributions = distributions; return this; }
        
        public Survey build() {
            Survey s = new Survey();
            s.id = this.id;
            s.publicId = this.publicId;
            s.title = this.title;
            s.description = this.description;
            s.status = this.status;
            s.allowAnonymous = this.allowAnonymous;
            s.showProgressBar = this.showProgressBar;
            s.allowBackNavigation = this.allowBackNavigation;
            s.randomizeQuestions = this.randomizeQuestions;
            s.oneQuestionPerPage = this.oneQuestionPerPage;
            s.requireLogin = this.requireLogin;
            s.responseLimit = this.responseLimit;
            s.startDate = this.startDate;
            s.endDate = this.endDate;
            s.logoUrl = this.logoUrl;
            s.primaryColor = this.primaryColor;
            s.backgroundColor = this.backgroundColor;
            s.welcomeMessage = this.welcomeMessage;
            s.thankYouMessage = this.thankYouMessage;
            s.redirectUrl = this.redirectUrl;
            s.customCss = this.customCss;
            s.language = this.language;
            s.totalResponses = this.totalResponses;
            s.completedResponses = this.completedResponses;
            s.averageCompletionTime = this.averageCompletionTime;
            s.completionRate = this.completionRate;
            s.createdAt = this.createdAt;
            s.updatedAt = this.updatedAt;
            s.publishedAt = this.publishedAt;
            s.closedAt = this.closedAt;
            s.company = this.company;
            s.createdBy = this.createdBy;
            s.questions = this.questions != null ? this.questions : new ArrayList<>();
            s.responses = this.responses != null ? this.responses : new ArrayList<>();
            s.distributions = this.distributions != null ? this.distributions : new ArrayList<>();
            return s;
        }
    }
}
