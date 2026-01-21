package com.numia.surveys.dto.contact;

import com.numia.surveys.model.Contact;
import java.time.LocalDateTime;

public class ContactDTO {
    private Long id;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String fullName;
    private String customFields;
    private Boolean active;
    private Boolean emailOptOut;
    private Boolean smsOptOut;
    private Integer surveysReceived;
    private Integer surveysCompleted;
    private LocalDateTime lastContactedAt;
    private LocalDateTime lastRespondedAt;
    private LocalDateTime createdAt;
    
    public ContactDTO() {}
    
    public static ContactDTO fromEntity(Contact c) {
        ContactDTO dto = new ContactDTO();
        dto.id = c.getId();
        dto.email = c.getEmail();
        dto.phone = c.getPhone();
        dto.firstName = c.getFirstName();
        dto.lastName = c.getLastName();
        dto.fullName = c.getFullName();
        dto.customFields = c.getCustomFields();
        dto.active = c.getActive();
        dto.emailOptOut = c.getEmailOptOut();
        dto.smsOptOut = c.getSmsOptOut();
        dto.surveysReceived = c.getSurveysReceived();
        dto.surveysCompleted = c.getSurveysCompleted();
        dto.lastContactedAt = c.getLastContactedAt();
        dto.lastRespondedAt = c.getLastRespondedAt();
        dto.createdAt = c.getCreatedAt();
        return dto;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getEmailOptOut() { return emailOptOut; }
    public void setEmailOptOut(Boolean emailOptOut) { this.emailOptOut = emailOptOut; }
    public Boolean getSmsOptOut() { return smsOptOut; }
    public void setSmsOptOut(Boolean smsOptOut) { this.smsOptOut = smsOptOut; }
    public Integer getSurveysReceived() { return surveysReceived; }
    public void setSurveysReceived(Integer surveysReceived) { this.surveysReceived = surveysReceived; }
    public Integer getSurveysCompleted() { return surveysCompleted; }
    public void setSurveysCompleted(Integer surveysCompleted) { this.surveysCompleted = surveysCompleted; }
    public LocalDateTime getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; }
    public LocalDateTime getLastRespondedAt() { return lastRespondedAt; }
    public void setLastRespondedAt(LocalDateTime lastRespondedAt) { this.lastRespondedAt = lastRespondedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
