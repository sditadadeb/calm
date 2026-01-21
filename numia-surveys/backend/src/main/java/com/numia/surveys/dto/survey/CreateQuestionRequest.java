package com.numia.surveys.dto.survey;

import com.numia.surveys.model.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateQuestionRequest {
    
    @NotBlank(message = "El texto de la pregunta es requerido")
    private String text;
    
    private String description;
    
    @NotNull(message = "El tipo de pregunta es requerido")
    private QuestionType type;
    
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
    private String displayLogic;
    private String skipLogic;
    private String matrixRows;
    private List<CreateQuestionOptionRequest> options;
    
    public CreateQuestionRequest() {}
    
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
    public List<CreateQuestionOptionRequest> getOptions() { return options; }
    public void setOptions(List<CreateQuestionOptionRequest> options) { this.options = options; }
}
