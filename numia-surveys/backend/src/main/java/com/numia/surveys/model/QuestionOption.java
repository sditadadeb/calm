package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "question_options")
public class QuestionOption {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String text;
    
    @Column(name = "option_value")
    private String value;
    private Integer orderIndex;
    private String imageUrl;
    private Integer score;
    private Boolean exclusive = false;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    public QuestionOption() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (value == null || value.isEmpty()) {
            value = text;
        }
    }
    
    // Getters and Setters
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
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        QuestionOption that = (QuestionOption) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String text, value, imageUrl;
        private Integer orderIndex, score;
        private Boolean exclusive = false;
        private LocalDateTime createdAt;
        private Question question;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder text(String text) { this.text = text; return this; }
        public Builder value(String value) { this.value = value; return this; }
        public Builder orderIndex(Integer orderIndex) { this.orderIndex = orderIndex; return this; }
        public Builder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public Builder score(Integer score) { this.score = score; return this; }
        public Builder exclusive(Boolean exclusive) { this.exclusive = exclusive; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder question(Question question) { this.question = question; return this; }
        
        public QuestionOption build() {
            QuestionOption o = new QuestionOption();
            o.id = this.id; o.text = this.text; o.value = this.value;
            o.orderIndex = this.orderIndex; o.imageUrl = this.imageUrl;
            o.score = this.score; o.exclusive = this.exclusive;
            o.createdAt = this.createdAt; o.question = this.question;
            return o;
        }
    }
}
