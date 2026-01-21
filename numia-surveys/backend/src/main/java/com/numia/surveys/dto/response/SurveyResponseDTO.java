package com.numia.surveys.dto.response;

import com.numia.surveys.model.SurveyResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class SurveyResponseDTO {
    private Long id;
    private String responseId;
    private String respondentEmail;
    private String respondentName;
    private String respondentPhone;
    private String ipAddress;
    private String country;
    private String city;
    private Boolean completed;
    private Integer completedQuestions;
    private Integer totalQuestions;
    private Integer completionTimeSeconds;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private List<AnswerDTO> answers;
    
    public SurveyResponseDTO() {}
    
    public static SurveyResponseDTO fromEntity(SurveyResponse response) {
        return fromEntity(response, false);
    }
    
    public static SurveyResponseDTO fromEntity(SurveyResponse response, boolean includeAnswers) {
        SurveyResponseDTO dto = new SurveyResponseDTO();
        dto.id = response.getId();
        dto.responseId = response.getResponseId();
        dto.respondentEmail = response.getRespondentEmail();
        dto.respondentName = response.getRespondentName();
        dto.respondentPhone = response.getRespondentPhone();
        dto.ipAddress = response.getIpAddress();
        dto.country = response.getCountry();
        dto.city = response.getCity();
        dto.completed = response.getCompleted();
        dto.completedQuestions = response.getCompletedQuestions();
        dto.totalQuestions = response.getTotalQuestions();
        dto.completionTimeSeconds = response.getCompletionTimeSeconds();
        dto.startedAt = response.getStartedAt();
        dto.completedAt = response.getCompletedAt();
        dto.createdAt = response.getCreatedAt();
        if (includeAnswers && response.getAnswers() != null) {
            dto.answers = response.getAnswers().stream().map(AnswerDTO::fromEntity).collect(Collectors.toList());
        }
        return dto;
    }
    
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
    public Integer getCompletionTimeSeconds() { return completionTimeSeconds; }
    public void setCompletionTimeSeconds(Integer completionTimeSeconds) { this.completionTimeSeconds = completionTimeSeconds; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<AnswerDTO> getAnswers() { return answers; }
    public void setAnswers(List<AnswerDTO> answers) { this.answers = answers; }
}
