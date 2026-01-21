package com.numia.surveys.dto.response;

import com.numia.surveys.model.Answer;
import java.time.LocalDateTime;

public class AnswerDTO {
    private Long id;
    private Long questionId;
    private String questionText;
    private String textValue;
    private Double numericValue;
    private String selectedOptionIds;
    private String matrixRow;
    private String fileUrl;
    private Integer answerTimeSeconds;
    private LocalDateTime createdAt;
    
    public AnswerDTO() {}
    
    public static AnswerDTO fromEntity(Answer answer) {
        AnswerDTO dto = new AnswerDTO();
        dto.id = answer.getId();
        dto.questionId = answer.getQuestion().getId();
        dto.questionText = answer.getQuestion().getText();
        dto.textValue = answer.getTextValue();
        dto.numericValue = answer.getNumericValue();
        dto.selectedOptionIds = answer.getSelectedOptionIds();
        dto.matrixRow = answer.getMatrixRow();
        dto.fileUrl = answer.getFileUrl();
        dto.answerTimeSeconds = answer.getAnswerTimeSeconds();
        dto.createdAt = answer.getCreatedAt();
        return dto;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
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
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private final AnswerDTO dto = new AnswerDTO();
        public Builder id(Long id) { dto.id = id; return this; }
        public Builder questionId(Long questionId) { dto.questionId = questionId; return this; }
        public Builder questionText(String questionText) { dto.questionText = questionText; return this; }
        public Builder textValue(String textValue) { dto.textValue = textValue; return this; }
        public Builder numericValue(Double numericValue) { dto.numericValue = numericValue; return this; }
        public Builder selectedOptionIds(String selectedOptionIds) { dto.selectedOptionIds = selectedOptionIds; return this; }
        public Builder matrixRow(String matrixRow) { dto.matrixRow = matrixRow; return this; }
        public Builder fileUrl(String fileUrl) { dto.fileUrl = fileUrl; return this; }
        public Builder answerTimeSeconds(Integer answerTimeSeconds) { dto.answerTimeSeconds = answerTimeSeconds; return this; }
        public Builder createdAt(LocalDateTime createdAt) { dto.createdAt = createdAt; return this; }
        public AnswerDTO build() { return dto; }
    }
}
