package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "survey_responses")
public class SurveyResponse {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String responseId;
    
    private String respondentEmail;
    private String respondentName;
    private String respondentPhone;
    private String ipAddress;
    private String userAgent;
    private String referrer;
    private String country;
    private String city;
    private Boolean completed = false;
    private Integer completedQuestions;
    private Integer totalQuestions;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer completionTimeSeconds;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "distribution_id")
    private Distribution distribution;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;
    
    @OneToMany(mappedBy = "surveyResponse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Answer> answers = new ArrayList<>();
    
    public SurveyResponse() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
        if (responseId == null || responseId.isEmpty()) {
            responseId = UUID.randomUUID().toString();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void markCompleted() {
        this.completed = true;
        this.completedAt = LocalDateTime.now();
        if (startedAt != null) {
            this.completionTimeSeconds = (int) java.time.Duration.between(startedAt, completedAt).getSeconds();
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getResponseId() { return responseId; }
    public void setResponseId(String responseId) { this.responseId = responseId; }
    
    public String getRespondentEmail() { return respondentEmail; }
    public void setRespondentEmail(String respondentEmail) { this.respondentEmail = respondentEmail; }
    
    public String getRespondentName() { return respondentName; }
    public void setRespondentName(String respondentName) { this.respondentName = respondentName; }
    
    public String getRespondentPhone() { return respondentPhone; }
    public void setRespondentPhone(String respondentPhone) { this.respondentPhone = respondentPhone; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getReferrer() { return referrer; }
    public void setReferrer(String referrer) { this.referrer = referrer; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    
    public Integer getCompletedQuestions() { return completedQuestions; }
    public void setCompletedQuestions(Integer completedQuestions) { this.completedQuestions = completedQuestions; }
    
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public Integer getCompletionTimeSeconds() { return completionTimeSeconds; }
    public void setCompletionTimeSeconds(Integer completionTimeSeconds) { this.completionTimeSeconds = completionTimeSeconds; }
    
    public Distribution getDistribution() { return distribution; }
    public void setDistribution(Distribution distribution) { this.distribution = distribution; }
    
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }
    
    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }
    
    public List<Answer> getAnswers() { return answers; }
    public void setAnswers(List<Answer> answers) { this.answers = answers; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SurveyResponse sr = (SurveyResponse) o;
        return Objects.equals(id, sr.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String responseId, respondentEmail, respondentName, respondentPhone;
        private String ipAddress, userAgent, referrer, country, city, metadata;
        private Boolean completed = false;
        private Integer completedQuestions, totalQuestions, completionTimeSeconds;
        private LocalDateTime startedAt, completedAt, createdAt, updatedAt;
        private Distribution distribution;
        private Survey survey;
        private Contact contact;
        private List<Answer> answers = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder responseId(String responseId) { this.responseId = responseId; return this; }
        public Builder respondentEmail(String respondentEmail) { this.respondentEmail = respondentEmail; return this; }
        public Builder respondentName(String respondentName) { this.respondentName = respondentName; return this; }
        public Builder respondentPhone(String respondentPhone) { this.respondentPhone = respondentPhone; return this; }
        public Builder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public Builder userAgent(String userAgent) { this.userAgent = userAgent; return this; }
        public Builder referrer(String referrer) { this.referrer = referrer; return this; }
        public Builder country(String country) { this.country = country; return this; }
        public Builder city(String city) { this.city = city; return this; }
        public Builder completed(Boolean completed) { this.completed = completed; return this; }
        public Builder completedQuestions(Integer completedQuestions) { this.completedQuestions = completedQuestions; return this; }
        public Builder totalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public Builder startedAt(LocalDateTime startedAt) { this.startedAt = startedAt; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }
        public Builder completionTimeSeconds(Integer completionTimeSeconds) { this.completionTimeSeconds = completionTimeSeconds; return this; }
        public Builder distribution(Distribution distribution) { this.distribution = distribution; return this; }
        public Builder metadata(String metadata) { this.metadata = metadata; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder survey(Survey survey) { this.survey = survey; return this; }
        public Builder contact(Contact contact) { this.contact = contact; return this; }
        public Builder answers(List<Answer> answers) { this.answers = answers; return this; }
        
        public SurveyResponse build() {
            SurveyResponse sr = new SurveyResponse();
            sr.id = this.id; sr.responseId = this.responseId;
            sr.respondentEmail = this.respondentEmail; sr.respondentName = this.respondentName;
            sr.respondentPhone = this.respondentPhone; sr.ipAddress = this.ipAddress;
            sr.userAgent = this.userAgent; sr.referrer = this.referrer;
            sr.country = this.country; sr.city = this.city;
            sr.completed = this.completed; sr.completedQuestions = this.completedQuestions;
            sr.totalQuestions = this.totalQuestions; sr.startedAt = this.startedAt;
            sr.completedAt = this.completedAt; sr.completionTimeSeconds = this.completionTimeSeconds;
            sr.distribution = this.distribution; sr.metadata = this.metadata;
            sr.createdAt = this.createdAt; sr.updatedAt = this.updatedAt;
            sr.survey = this.survey; sr.contact = this.contact;
            sr.answers = this.answers != null ? this.answers : new ArrayList<>();
            return sr;
        }
    }
}
