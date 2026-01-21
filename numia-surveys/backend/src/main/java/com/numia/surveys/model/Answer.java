package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "answers")
public class Answer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT")
    private String textValue;
    
    private Double numericValue;
    private String selectedOptionIds;
    private String matrixRow;
    private String fileUrl;
    private Integer answerTimeSeconds;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_response_id", nullable = false)
    private SurveyResponse surveyResponse;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    public Answer() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTextValue() { return textValue; }
    public void setTextValue(String textValue) { this.textValue = textValue; }
    
    public Double getNumericValue() { return numericValue; }
    public void setNumericValue(Double numericValue) { this.numericValue = numericValue; }
    
    public String getSelectedOptionIds() { return selectedOptionIds; }
    public void setSelectedOptionIds(String selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }
    
    public String getMatrixRow() { return matrixRow; }
    public void setMatrixRow(String matrixRow) { this.matrixRow = matrixRow; }
    
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    
    public Integer getAnswerTimeSeconds() { return answerTimeSeconds; }
    public void setAnswerTimeSeconds(Integer answerTimeSeconds) { this.answerTimeSeconds = answerTimeSeconds; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public SurveyResponse getSurveyResponse() { return surveyResponse; }
    public void setSurveyResponse(SurveyResponse surveyResponse) { this.surveyResponse = surveyResponse; }
    
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Answer a = (Answer) o;
        return Objects.equals(id, a.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String textValue, selectedOptionIds, matrixRow, fileUrl;
        private Double numericValue;
        private Integer answerTimeSeconds;
        private LocalDateTime createdAt;
        private SurveyResponse surveyResponse;
        private Question question;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder textValue(String textValue) { this.textValue = textValue; return this; }
        public Builder numericValue(Double numericValue) { this.numericValue = numericValue; return this; }
        public Builder selectedOptionIds(String selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; return this; }
        public Builder matrixRow(String matrixRow) { this.matrixRow = matrixRow; return this; }
        public Builder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public Builder answerTimeSeconds(Integer answerTimeSeconds) { this.answerTimeSeconds = answerTimeSeconds; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder surveyResponse(SurveyResponse surveyResponse) { this.surveyResponse = surveyResponse; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        
        public Answer build() {
            Answer a = new Answer();
            a.id = this.id; a.textValue = this.textValue; a.numericValue = this.numericValue;
            a.selectedOptionIds = this.selectedOptionIds; a.matrixRow = this.matrixRow;
            a.fileUrl = this.fileUrl; a.answerTimeSeconds = this.answerTimeSeconds;
            a.createdAt = this.createdAt; a.surveyResponse = this.surveyResponse; a.question = this.question;
            return a;
        }
    }
}
