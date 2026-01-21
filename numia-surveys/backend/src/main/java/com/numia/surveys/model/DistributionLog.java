package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "distribution_logs")
public class DistributionLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String recipientEmail;
    private String recipientPhone;
    private Boolean sent = false;
    private Boolean delivered = false;
    private Boolean opened = false;
    private Boolean clicked = false;
    private Boolean responded = false;
    private Boolean bounced = false;
    private Boolean unsubscribed = false;
    private String externalMessageId;
    private String errorMessage;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime openedAt;
    private LocalDateTime clickedAt;
    private LocalDateTime respondedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "distribution_id", nullable = false)
    private Distribution distribution;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;
    
    public DistributionLog() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }
    
    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
    
    public Boolean getSent() { return sent; }
    public void setSent(Boolean sent) { this.sent = sent; }
    
    public Boolean getDelivered() { return delivered; }
    public void setDelivered(Boolean delivered) { this.delivered = delivered; }
    
    public Boolean getOpened() { return opened; }
    public void setOpened(Boolean opened) { this.opened = opened; }
    
    public Boolean getClicked() { return clicked; }
    public void setClicked(Boolean clicked) { this.clicked = clicked; }
    
    public Boolean getResponded() { return responded; }
    public void setResponded(Boolean responded) { this.responded = responded; }
    
    public Boolean getBounced() { return bounced; }
    public void setBounced(Boolean bounced) { this.bounced = bounced; }
    
    public Boolean getUnsubscribed() { return unsubscribed; }
    public void setUnsubscribed(Boolean unsubscribed) { this.unsubscribed = unsubscribed; }
    
    public String getExternalMessageId() { return externalMessageId; }
    public void setExternalMessageId(String externalMessageId) { this.externalMessageId = externalMessageId; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    
    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }
    
    public LocalDateTime getClickedAt() { return clickedAt; }
    public void setClickedAt(LocalDateTime clickedAt) { this.clickedAt = clickedAt; }
    
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Distribution getDistribution() { return distribution; }
    public void setDistribution(Distribution distribution) { this.distribution = distribution; }
    
    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DistributionLog dl = (DistributionLog) o;
        return Objects.equals(id, dl.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String recipientEmail, recipientPhone, externalMessageId, errorMessage;
        private Boolean sent = false, delivered = false, opened = false;
        private Boolean clicked = false, responded = false, bounced = false, unsubscribed = false;
        private LocalDateTime sentAt, deliveredAt, openedAt, clickedAt, respondedAt, createdAt;
        private Distribution distribution;
        private Contact contact;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder recipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; return this; }
        public Builder recipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; return this; }
        public Builder sent(Boolean sent) { this.sent = sent; return this; }
        public Builder delivered(Boolean delivered) { this.delivered = delivered; return this; }
        public Builder opened(Boolean opened) { this.opened = opened; return this; }
        public Builder clicked(Boolean clicked) { this.clicked = clicked; return this; }
        public Builder responded(Boolean responded) { this.responded = responded; return this; }
        public Builder bounced(Boolean bounced) { this.bounced = bounced; return this; }
        public Builder unsubscribed(Boolean unsubscribed) { this.unsubscribed = unsubscribed; return this; }
        public Builder externalMessageId(String externalMessageId) { this.externalMessageId = externalMessageId; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }
        public Builder deliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; return this; }
        public Builder openedAt(LocalDateTime openedAt) { this.openedAt = openedAt; return this; }
        public Builder clickedAt(LocalDateTime clickedAt) { this.clickedAt = clickedAt; return this; }
        public Builder respondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder distribution(Distribution distribution) { this.distribution = distribution; return this; }
        public Builder contact(Contact contact) { this.contact = contact; return this; }
        
        public DistributionLog build() {
            DistributionLog dl = new DistributionLog();
            dl.id = this.id; dl.recipientEmail = this.recipientEmail;
            dl.recipientPhone = this.recipientPhone; dl.sent = this.sent;
            dl.delivered = this.delivered; dl.opened = this.opened;
            dl.clicked = this.clicked; dl.responded = this.responded;
            dl.bounced = this.bounced; dl.unsubscribed = this.unsubscribed;
            dl.externalMessageId = this.externalMessageId; dl.errorMessage = this.errorMessage;
            dl.sentAt = this.sentAt; dl.deliveredAt = this.deliveredAt;
            dl.openedAt = this.openedAt; dl.clickedAt = this.clickedAt;
            dl.respondedAt = this.respondedAt; dl.createdAt = this.createdAt;
            dl.distribution = this.distribution; dl.contact = this.contact;
            return dl;
        }
    }
}
