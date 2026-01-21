package com.numia.surveys.dto.distribution;

import com.numia.surveys.model.enums.DistributionChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateDistributionRequest {
    
    @NotBlank(message = "El nombre es requerido")
    private String name;
    
    @NotNull(message = "El canal es requerido")
    private DistributionChannel channel;
    
    @NotNull(message = "La encuesta es requerida")
    private Long surveyId;
    
    @NotNull(message = "La lista de contactos es requerida")
    private Long contactListId;
    
    private String subject;
    
    @NotBlank(message = "El mensaje es requerido")
    private String messageTemplate;
    
    private String senderName;
    private String replyTo;
    private LocalDateTime scheduledAt;
    private Boolean sendImmediately = true;
    
    public CreateDistributionRequest() {}
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public DistributionChannel getChannel() { return channel; }
    public void setChannel(DistributionChannel channel) { this.channel = channel; }
    public Long getSurveyId() { return surveyId; }
    public void setSurveyId(Long surveyId) { this.surveyId = surveyId; }
    public Long getContactListId() { return contactListId; }
    public void setContactListId(Long contactListId) { this.contactListId = contactListId; }
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
    public Boolean getSendImmediately() { return sendImmediately; }
    public void setSendImmediately(Boolean sendImmediately) { this.sendImmediately = sendImmediately; }
}
