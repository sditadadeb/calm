package com.numia.surveys.dto.survey;

import com.numia.surveys.model.Question;
import com.numia.surveys.model.enums.QuestionType;
import java.util.List;
import java.util.stream.Collectors;

public class QuestionDTO {
    private Long id;
    private String text;
    private String description;
    private QuestionType type;
    private Integer orderIndex;
    private Boolean required;
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
    private Boolean randomizeOptions;
    private Boolean showOtherOption;
    private String displayLogic;
    private String skipLogic;
    private String matrixRows;
    private List<QuestionOptionDTO> options;
    
    public QuestionDTO() {}
    
    public static QuestionDTO fromEntity(Question question) {
        QuestionDTO dto = new QuestionDTO();
        dto.id = question.getId();
        dto.text = question.getText();
        dto.description = question.getDescription();
        dto.type = question.getType();
        dto.orderIndex = question.getOrderIndex();
        dto.required = question.getRequired();
        dto.minLength = question.getMinLength();
        dto.maxLength = question.getMaxLength();
        dto.minValue = question.getMinValue();
        dto.maxValue = question.getMaxValue();
        dto.validationRegex = question.getValidationRegex();
        dto.validationMessage = question.getValidationMessage();
        dto.scaleMin = question.getScaleMin();
        dto.scaleMax = question.getScaleMax();
        dto.scaleMinLabel = question.getScaleMinLabel();
        dto.scaleMaxLabel = question.getScaleMaxLabel();
        dto.placeholder = question.getPlaceholder();
        dto.imageUrl = question.getImageUrl();
        dto.randomizeOptions = question.getRandomizeOptions();
        dto.showOtherOption = question.getShowOtherOption();
        dto.displayLogic = question.getDisplayLogic();
        dto.skipLogic = question.getSkipLogic();
        dto.matrixRows = question.getMatrixRows();
        dto.options = question.getOptions() != null ? 
                question.getOptions().stream().map(QuestionOptionDTO::fromEntity).collect(Collectors.toList()) : null;
        return dto;
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
    public List<QuestionOptionDTO> getOptions() { return options; }
    public void setOptions(List<QuestionOptionDTO> options) { this.options = options; }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private final QuestionDTO dto = new QuestionDTO();
        
        public Builder id(Long id) { dto.id = id; return this; }
        public Builder text(String text) { dto.text = text; return this; }
        public Builder description(String description) { dto.description = description; return this; }
        public Builder type(QuestionType type) { dto.type = type; return this; }
        public Builder orderIndex(Integer orderIndex) { dto.orderIndex = orderIndex; return this; }
        public Builder required(Boolean required) { dto.required = required; return this; }
        public Builder minLength(Integer minLength) { dto.minLength = minLength; return this; }
        public Builder maxLength(Integer maxLength) { dto.maxLength = maxLength; return this; }
        public Builder minValue(Integer minValue) { dto.minValue = minValue; return this; }
        public Builder maxValue(Integer maxValue) { dto.maxValue = maxValue; return this; }
        public Builder validationRegex(String validationRegex) { dto.validationRegex = validationRegex; return this; }
        public Builder validationMessage(String validationMessage) { dto.validationMessage = validationMessage; return this; }
        public Builder scaleMin(Integer scaleMin) { dto.scaleMin = scaleMin; return this; }
        public Builder scaleMax(Integer scaleMax) { dto.scaleMax = scaleMax; return this; }
        public Builder scaleMinLabel(String scaleMinLabel) { dto.scaleMinLabel = scaleMinLabel; return this; }
        public Builder scaleMaxLabel(String scaleMaxLabel) { dto.scaleMaxLabel = scaleMaxLabel; return this; }
        public Builder placeholder(String placeholder) { dto.placeholder = placeholder; return this; }
        public Builder imageUrl(String imageUrl) { dto.imageUrl = imageUrl; return this; }
        public Builder randomizeOptions(Boolean randomizeOptions) { dto.randomizeOptions = randomizeOptions; return this; }
        public Builder showOtherOption(Boolean showOtherOption) { dto.showOtherOption = showOtherOption; return this; }
        public Builder displayLogic(String displayLogic) { dto.displayLogic = displayLogic; return this; }
        public Builder skipLogic(String skipLogic) { dto.skipLogic = skipLogic; return this; }
        public Builder matrixRows(String matrixRows) { dto.matrixRows = matrixRows; return this; }
        public Builder options(List<QuestionOptionDTO> options) { dto.options = options; return this; }
        
        public QuestionDTO build() { return dto; }
    }
}
