package com.numia.surveys.model;

import com.numia.surveys.model.enums.QuestionType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "questions")
public class Question {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;
    
    @Column(nullable = false)
    private Integer orderIndex;
    
    private Boolean required = false;
    private Integer minLength;
    private Integer maxLength;
    private Integer minValue;
    private Integer maxValue;
    private String validationRegex;
    private String validationMessage;
    
    private Integer scaleMin;
    private Integer scaleMax;
    private String scaleMinLabel;
    private String scaleMaxLabel;
    
    private String placeholder;
    private String imageUrl;
    private Boolean randomizeOptions = false;
    private Boolean showOtherOption = false;
    
    @Column(columnDefinition = "TEXT")
    private String displayLogic;
    
    @Column(columnDefinition = "TEXT")
    private String skipLogic;
    
    @Column(columnDefinition = "TEXT")
    private String matrixRows;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<QuestionOption> options = new ArrayList<>();
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    private List<Answer> answers = new ArrayList<>();
    
    public Question() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public QuestionType getType() { return type; }
    public void setType(QuestionType type) { this.type = type; }
    
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    
    public Boolean getRequired() { return required; }
    public void setRequired(Boolean required) { this.required = required; }
    
    public Integer getMinLength() { return minLength; }
    public void setMinLength(Integer minLength) { this.minLength = minLength; }
    
    public Integer getMaxLength() { return maxLength; }
    public void setMaxLength(Integer maxLength) { this.maxLength = maxLength; }
    
    public Integer getMinValue() { return minValue; }
    public void setMinValue(Integer minValue) { this.minValue = minValue; }
    
    public Integer getMaxValue() { return maxValue; }
    public void setMaxValue(Integer maxValue) { this.maxValue = maxValue; }
    
    public String getValidationRegex() { return validationRegex; }
    public void setValidationRegex(String validationRegex) { this.validationRegex = validationRegex; }
    
    public String getValidationMessage() { return validationMessage; }
    public void setValidationMessage(String validationMessage) { this.validationMessage = validationMessage; }
    
    public Integer getScaleMin() { return scaleMin; }
    public void setScaleMin(Integer scaleMin) { this.scaleMin = scaleMin; }
    
    public Integer getScaleMax() { return scaleMax; }
    public void setScaleMax(Integer scaleMax) { this.scaleMax = scaleMax; }
    
    public String getScaleMinLabel() { return scaleMinLabel; }
    public void setScaleMinLabel(String scaleMinLabel) { this.scaleMinLabel = scaleMinLabel; }
    
    public String getScaleMaxLabel() { return scaleMaxLabel; }
    public void setScaleMaxLabel(String scaleMaxLabel) { this.scaleMaxLabel = scaleMaxLabel; }
    
    public String getPlaceholder() { return placeholder; }
    public void setPlaceholder(String placeholder) { this.placeholder = placeholder; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public Boolean getRandomizeOptions() { return randomizeOptions; }
    public void setRandomizeOptions(Boolean randomizeOptions) { this.randomizeOptions = randomizeOptions; }
    
    public Boolean getShowOtherOption() { return showOtherOption; }
    public void setShowOtherOption(Boolean showOtherOption) { this.showOtherOption = showOtherOption; }
    
    public String getDisplayLogic() { return displayLogic; }
    public void setDisplayLogic(String displayLogic) { this.displayLogic = displayLogic; }
    
    public String getSkipLogic() { return skipLogic; }
    public void setSkipLogic(String skipLogic) { this.skipLogic = skipLogic; }
    
    public String getMatrixRows() { return matrixRows; }
    public void setMatrixRows(String matrixRows) { this.matrixRows = matrixRows; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }
    
    public List<QuestionOption> getOptions() { return options; }
    public void setOptions(List<QuestionOption> options) { this.options = options; }
    
    public List<Answer> getAnswers() { return answers; }
    public void setAnswers(List<Answer> answers) { this.answers = answers; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Question q = (Question) o;
        return Objects.equals(id, q.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    @Override
    public String toString() { return "Question{id=" + id + ", text='" + text + "'}"; }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String text;
        private String description;
        private QuestionType type;
        private Integer orderIndex;
        private Boolean required = false;
        private Integer minLength, maxLength, minValue, maxValue;
        private String validationRegex, validationMessage;
        private Integer scaleMin, scaleMax;
        private String scaleMinLabel, scaleMaxLabel;
        private String placeholder, imageUrl;
        private Boolean randomizeOptions = false, showOtherOption = false;
        private String displayLogic, skipLogic, matrixRows;
        private LocalDateTime createdAt, updatedAt;
        private Survey survey;
        private List<QuestionOption> options = new ArrayList<>();
        private List<Answer> answers = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder text(String text) { this.text = text; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder type(QuestionType type) { this.type = type; return this; }
        public Builder orderIndex(Integer orderIndex) { this.orderIndex = orderIndex; return this; }
        public Builder required(Boolean required) { this.required = required; return this; }
        public Builder minLength(Integer minLength) { this.minLength = minLength; return this; }
        public Builder maxLength(Integer maxLength) { this.maxLength = maxLength; return this; }
        public Builder minValue(Integer minValue) { this.minValue = minValue; return this; }
        public Builder maxValue(Integer maxValue) { this.maxValue = maxValue; return this; }
        public Builder validationRegex(String validationRegex) { this.validationRegex = validationRegex; return this; }
        public Builder validationMessage(String validationMessage) { this.validationMessage = validationMessage; return this; }
        public Builder scaleMin(Integer scaleMin) { this.scaleMin = scaleMin; return this; }
        public Builder scaleMax(Integer scaleMax) { this.scaleMax = scaleMax; return this; }
        public Builder scaleMinLabel(String scaleMinLabel) { this.scaleMinLabel = scaleMinLabel; return this; }
        public Builder scaleMaxLabel(String scaleMaxLabel) { this.scaleMaxLabel = scaleMaxLabel; return this; }
        public Builder placeholder(String placeholder) { this.placeholder = placeholder; return this; }
        public Builder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public Builder randomizeOptions(Boolean randomizeOptions) { this.randomizeOptions = randomizeOptions; return this; }
        public Builder showOtherOption(Boolean showOtherOption) { this.showOtherOption = showOtherOption; return this; }
        public Builder displayLogic(String displayLogic) { this.displayLogic = displayLogic; return this; }
        public Builder skipLogic(String skipLogic) { this.skipLogic = skipLogic; return this; }
        public Builder matrixRows(String matrixRows) { this.matrixRows = matrixRows; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder survey(Survey survey) { this.survey = survey; return this; }
        public Builder options(List<QuestionOption> options) { this.options = options; return this; }
        public Builder answers(List<Answer> answers) { this.answers = answers; return this; }
        
        public Question build() {
            Question q = new Question();
            q.id = this.id; q.text = this.text; q.description = this.description;
            q.type = this.type; q.orderIndex = this.orderIndex; q.required = this.required;
            q.minLength = this.minLength; q.maxLength = this.maxLength;
            q.minValue = this.minValue; q.maxValue = this.maxValue;
            q.validationRegex = this.validationRegex; q.validationMessage = this.validationMessage;
            q.scaleMin = this.scaleMin; q.scaleMax = this.scaleMax;
            q.scaleMinLabel = this.scaleMinLabel; q.scaleMaxLabel = this.scaleMaxLabel;
            q.placeholder = this.placeholder; q.imageUrl = this.imageUrl;
            q.randomizeOptions = this.randomizeOptions; q.showOtherOption = this.showOtherOption;
            q.displayLogic = this.displayLogic; q.skipLogic = this.skipLogic;
            q.matrixRows = this.matrixRows;
            q.createdAt = this.createdAt; q.updatedAt = this.updatedAt;
            q.survey = this.survey;
            q.options = this.options != null ? this.options : new ArrayList<>();
            q.answers = this.answers != null ? this.answers : new ArrayList<>();
            return q;
        }
    }
}
