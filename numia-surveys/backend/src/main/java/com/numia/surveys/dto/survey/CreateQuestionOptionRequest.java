package com.numia.surveys.dto.survey;

import jakarta.validation.constraints.NotBlank;

public class CreateQuestionOptionRequest {
    
    @NotBlank(message = "El texto de la opción es requerido")
    private String text;
    
    private String value;
    private Integer orderIndex;
    private String imageUrl;
    private Integer score;
    private Boolean exclusive = false;
    
    public CreateQuestionOptionRequest() {}
    
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Boolean getExclusive() { return exclusive; }
    public void setExclusive(Boolean exclusive) { this.exclusive = exclusive; }
}
