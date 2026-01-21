package com.numia.surveys.dto.distribution;

import com.numia.surveys.model.Distribution;
import com.numia.surveys.model.enums.DistributionChannel;
import com.numia.surveys.model.enums.DistributionStatus;
import java.time.LocalDateTime;

public class DistributionDTO {
    private Long id;
    private String name;
    private DistributionChannel channel;
    private DistributionStatus status;
    private String subject;
    private String messageTemplate;
    private String senderName;
    private String replyTo;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime completedAt;
    private Integer totalRecipients;
    private Integer sentCount;
    private Integer deliveredCount;
    private Integer openedCount;
    private Integer clickedCount;
    private Integer respondedCount;
    private Integer failedCount;
    private Integer bouncedCount;
    private Integer unsubscribedCount;
    private Double deliveryRate;
    private Double openRate;
    private Double clickRate;
    private Double responseRate;
    private Long surveyId;
    private String surveyTitle;
    private Long contactListId;
    private String contactListName;
    private LocalDateTime createdAt;
    
    public DistributionDTO() {}
    
    public static DistributionDTO fromEntity(Distribution d) {
        DistributionDTO dto = new DistributionDTO();
        dto.id = d.getId();
        dto.name = d.getName();
        dto.channel = d.getChannel();
        dto.status = d.getStatus();
        dto.subject = d.getSubject();
        dto.messageTemplate = d.getMessageTemplate();
        dto.senderName = d.getSenderName();
        dto.replyTo = d.getReplyTo();
        dto.scheduledAt = d.getScheduledAt();
        dto.sentAt = d.getSentAt();
        dto.completedAt = d.getCompletedAt();
        dto.totalRecipients = d.getTotalRecipients();
        dto.sentCount = d.getSentCount();
        dto.deliveredCount = d.getDeliveredCount();
        dto.openedCount = d.getOpenedCount();
        dto.clickedCount = d.getClickedCount();
        dto.respondedCount = d.getRespondedCount();
        dto.failedCount = d.getFailedCount();
        dto.bouncedCount = d.getBouncedCount();
        dto.unsubscribedCount = d.getUnsubscribedCount();
        dto.surveyId = d.getSurvey() != null ? d.getSurvey().getId() : null;
        dto.surveyTitle = d.getSurvey() != null ? d.getSurvey().getTitle() : null;
        dto.contactListId = d.getContactList() != null ? d.getContactList().getId() : null;
        dto.contactListName = d.getContactList() != null ? d.getContactList().getName() : null;
        dto.createdAt = d.getCreatedAt();
        if (d.getSentCount() != null && d.getSentCount() > 0) {
            int sent = d.getSentCount();
            dto.deliveryRate = d.getDeliveredCount() != null ? (d.getDeliveredCount() * 100.0) / sent : 0.0;
            dto.openRate = d.getOpenedCount() != null ? (d.getOpenedCount() * 100.0) / sent : 0.0;
            dto.clickRate = d.getClickedCount() != null ? (d.getClickedCount() * 100.0) / sent : 0.0;
            dto.responseRate = d.getRespondedCount() != null ? (d.getRespondedCount() * 100.0) / sent : 0.0;
        }
        return dto;
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
    public Double getDeliveryRate() { return deliveryRate; }
    public void setDeliveryRate(Double deliveryRate) { this.deliveryRate = deliveryRate; }
    public Double getOpenRate() { return openRate; }
    public void setOpenRate(Double openRate) { this.openRate = openRate; }
    public Double getClickRate() { return clickRate; }
    public void setClickRate(Double clickRate) { this.clickRate = clickRate; }
    public Double getResponseRate() { return responseRate; }
    public void setResponseRate(Double responseRate) { this.responseRate = responseRate; }
    public Long getSurveyId() { return surveyId; }
    public void setSurveyId(Long surveyId) { this.surveyId = surveyId; }
    public String getSurveyTitle() { return surveyTitle; }
    public void setSurveyTitle(String surveyTitle) { this.surveyTitle = surveyTitle; }
    public Long getContactListId() { return contactListId; }
    public void setContactListId(Long contactListId) { this.contactListId = contactListId; }
    public String getContactListName() { return contactListName; }
    public void setContactListName(String contactListName) { this.contactListName = contactListName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
