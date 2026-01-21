package com.numia.surveys.model;

import com.numia.surveys.model.enums.DistributionChannel;
import com.numia.surveys.model.enums.DistributionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "distributions")
public class Distribution {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DistributionChannel channel;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DistributionStatus status = DistributionStatus.PENDING;
    
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String messageTemplate;
    
    private String senderName;
    private String replyTo;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime completedAt;
    
    private Integer totalRecipients = 0;
    private Integer sentCount = 0;
    private Integer deliveredCount = 0;
    private Integer openedCount = 0;
    private Integer clickedCount = 0;
    private Integer respondedCount = 0;
    private Integer failedCount = 0;
    private Integer bouncedCount = 0;
    private Integer unsubscribedCount = 0;
    
    @Column(columnDefinition = "TEXT")
    private String lastError;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_list_id")
    private ContactList contactList;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @OneToMany(mappedBy = "distribution", cascade = CascadeType.ALL)
    private List<DistributionLog> logs = new ArrayList<>();
    
    public Distribution() {}
    
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
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public DistributionChannel getChannel() { return channel; }
    public void setChannel(DistributionChannel channel) { this.channel = channel; }
    
    public DistributionStatus getStatus() { return status; }
    public void setStatus(DistributionStatus status) { this.status = status; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getMessageTemplate() { return messageTemplate; }
    public void setMessageTemplate(String messageTemplate) { this.messageTemplate = messageTemplate; }
    
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    
    public String getReplyTo() { return replyTo; }
    public void setReplyTo(String replyTo) { this.replyTo = replyTo; }
    
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public Integer getTotalRecipients() { return totalRecipients; }
    public void setTotalRecipients(Integer totalRecipients) { this.totalRecipients = totalRecipients; }
    
    public Integer getSentCount() { return sentCount; }
    public void setSentCount(Integer sentCount) { this.sentCount = sentCount; }
    
    public Integer getDeliveredCount() { return deliveredCount; }
    public void setDeliveredCount(Integer deliveredCount) { this.deliveredCount = deliveredCount; }
    
    public Integer getOpenedCount() { return openedCount; }
    public void setOpenedCount(Integer openedCount) { this.openedCount = openedCount; }
    
    public Integer getClickedCount() { return clickedCount; }
    public void setClickedCount(Integer clickedCount) { this.clickedCount = clickedCount; }
    
    public Integer getRespondedCount() { return respondedCount; }
    public void setRespondedCount(Integer respondedCount) { this.respondedCount = respondedCount; }
    
    public Integer getFailedCount() { return failedCount; }
    public void setFailedCount(Integer failedCount) { this.failedCount = failedCount; }
    
    public Integer getBouncedCount() { return bouncedCount; }
    public void setBouncedCount(Integer bouncedCount) { this.bouncedCount = bouncedCount; }
    
    public Integer getUnsubscribedCount() { return unsubscribedCount; }
    public void setUnsubscribedCount(Integer unsubscribedCount) { this.unsubscribedCount = unsubscribedCount; }
    
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }
    
    public ContactList getContactList() { return contactList; }
    public void setContactList(ContactList contactList) { this.contactList = contactList; }
    
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    
    public List<DistributionLog> getLogs() { return logs; }
    public void setLogs(List<DistributionLog> logs) { this.logs = logs; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Distribution d = (Distribution) o;
        return Objects.equals(id, d.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String name, subject, messageTemplate, senderName, replyTo, lastError;
        private DistributionChannel channel;
        private DistributionStatus status = DistributionStatus.PENDING;
        private LocalDateTime scheduledAt, sentAt, completedAt, createdAt, updatedAt;
        private Integer totalRecipients = 0, sentCount = 0, deliveredCount = 0;
        private Integer openedCount = 0, clickedCount = 0, respondedCount = 0;
        private Integer failedCount = 0, bouncedCount = 0, unsubscribedCount = 0;
        private Survey survey;
        private ContactList contactList;
        private User createdBy;
        private List<DistributionLog> logs = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder channel(DistributionChannel channel) { this.channel = channel; return this; }
        public Builder status(DistributionStatus status) { this.status = status; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder messageTemplate(String messageTemplate) { this.messageTemplate = messageTemplate; return this; }
        public Builder senderName(String senderName) { this.senderName = senderName; return this; }
        public Builder replyTo(String replyTo) { this.replyTo = replyTo; return this; }
        public Builder scheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; return this; }
        public Builder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }
        public Builder totalRecipients(Integer totalRecipients) { this.totalRecipients = totalRecipients; return this; }
        public Builder sentCount(Integer sentCount) { this.sentCount = sentCount; return this; }
        public Builder deliveredCount(Integer deliveredCount) { this.deliveredCount = deliveredCount; return this; }
        public Builder openedCount(Integer openedCount) { this.openedCount = openedCount; return this; }
        public Builder clickedCount(Integer clickedCount) { this.clickedCount = clickedCount; return this; }
        public Builder respondedCount(Integer respondedCount) { this.respondedCount = respondedCount; return this; }
        public Builder failedCount(Integer failedCount) { this.failedCount = failedCount; return this; }
        public Builder bouncedCount(Integer bouncedCount) { this.bouncedCount = bouncedCount; return this; }
        public Builder unsubscribedCount(Integer unsubscribedCount) { this.unsubscribedCount = unsubscribedCount; return this; }
        public Builder lastError(String lastError) { this.lastError = lastError; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder survey(Survey survey) { this.survey = survey; return this; }
        public Builder contactList(ContactList contactList) { this.contactList = contactList; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public Builder logs(List<DistributionLog> logs) { this.logs = logs; return this; }
        
        public Distribution build() {
            Distribution d = new Distribution();
            d.id = this.id; d.name = this.name; d.channel = this.channel;
            d.status = this.status; d.subject = this.subject;
            d.messageTemplate = this.messageTemplate; d.senderName = this.senderName;
            d.replyTo = this.replyTo; d.scheduledAt = this.scheduledAt;
            d.sentAt = this.sentAt; d.completedAt = this.completedAt;
            d.totalRecipients = this.totalRecipients; d.sentCount = this.sentCount;
            d.deliveredCount = this.deliveredCount; d.openedCount = this.openedCount;
            d.clickedCount = this.clickedCount; d.respondedCount = this.respondedCount;
            d.failedCount = this.failedCount; d.bouncedCount = this.bouncedCount;
            d.unsubscribedCount = this.unsubscribedCount; d.lastError = this.lastError;
            d.createdAt = this.createdAt; d.updatedAt = this.updatedAt;
            d.survey = this.survey; d.contactList = this.contactList;
            d.createdBy = this.createdBy;
            d.logs = this.logs != null ? this.logs : new ArrayList<>();
            return d;
        }
    }
}
