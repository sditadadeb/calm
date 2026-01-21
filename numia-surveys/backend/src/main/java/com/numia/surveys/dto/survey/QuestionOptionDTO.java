package com.numia.surveys.dto.survey;

import com.numia.surveys.model.QuestionOption;

public class QuestionOptionDTO {
    private Long id;
    private String text;
    private String value;
    private Integer orderIndex;
    private String imageUrl;
    private Integer score;
    private Boolean exclusive;
    
    public QuestionOptionDTO() {}
    
    public static QuestionOptionDTO fromEntity(QuestionOption option) {
        QuestionOptionDTO dto = new QuestionOptionDTO();
        dto.id = option.getId();
        dto.text = option.getText();
        dto.value = option.getValue();
        dto.orderIndex = option.getOrderIndex();
        dto.imageUrl = option.getImageUrl();
        dto.score = option.getScore();
        dto.exclusive = option.getExclusive();
        return dto;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
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
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private final QuestionOptionDTO dto = new QuestionOptionDTO();
        
        public Builder id(Long id) { dto.id = id; return this; }
        public Builder text(String text) { dto.text = text; return this; }
        public Builder value(String value) { dto.value = value; return this; }
        public Builder orderIndex(Integer orderIndex) { dto.orderIndex = orderIndex; return this; }
        public Builder imageUrl(String imageUrl) { dto.imageUrl = imageUrl; return this; }
        public Builder score(Integer score) { dto.score = score; return this; }
        public Builder exclusive(Boolean exclusive) { dto.exclusive = exclusive; return this; }
        
        public QuestionOptionDTO build() { return dto; }
    }
}
