package com.numia.surveys.dto.response;

import java.util.List;
import java.util.Map;

public class SubmitResponseRequest {
    private String respondentEmail;
    private String respondentName;
    private String respondentPhone;
    private Map<String, Object> metadata;
    private List<AnswerRequest> answers;
    
    public SubmitResponseRequest() {}
    
    public String getRespondentEmail() { return respondentEmail; }
    public void setRespondentEmail(String respondentEmail) { this.respondentEmail = respondentEmail; }
    public String getRespondentName() { return respondentName; }
    public void setRespondentName(String respondentName) { this.respondentName = respondentName; }
    public String getRespondentPhone() { return respondentPhone; }
    public void setRespondentPhone(String respondentPhone) { this.respondentPhone = respondentPhone; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    public List<AnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<AnswerRequest> answers) { this.answers = answers; }
    
    public static class AnswerRequest {
        private Long questionId;
        private String textValue;
        private Double numericValue;
        private List<Long> selectedOptionIds;
        private String matrixRow;
        private String fileUrl;
        
        public AnswerRequest() {}
        
        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }
        public String getTextValue() { return textValue; }
        public void setTextValue(String textValue) { this.textValue = textValue; }
        public Double getNumericValue() { return numericValue; }
        public void setNumericValue(Double numericValue) { this.numericValue = numericValue; }
        public List<Long> getSelectedOptionIds() { return selectedOptionIds; }
        public void setSelectedOptionIds(List<Long> selectedOptionIds) { this.selectedOptionIds = selectedOptionIds; }
        public String getMatrixRow() { return matrixRow; }
        public void setMatrixRow(String matrixRow) { this.matrixRow = matrixRow; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    }
}
