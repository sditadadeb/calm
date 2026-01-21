package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "contacts")
public class Contact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    
    @Column(columnDefinition = "TEXT")
    private String customFields;
    
    private Boolean active = true;
    private Boolean emailOptOut = false;
    private Boolean smsOptOut = false;
    private Integer surveysReceived = 0;
    private Integer surveysCompleted = 0;
    private LocalDateTime lastContactedAt;
    private LocalDateTime lastRespondedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_list_id", nullable = false)
    private ContactList contactList;
    
    public Contact() {}
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public String getFullName() {
        if (firstName == null && lastName == null) return null;
        return ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
    }
    
    // Getters and Setters
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
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public ContactList getContactList() { return contactList; }
    public void setContactList(ContactList contactList) { this.contactList = contactList; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Contact c = (Contact) o;
        return Objects.equals(id, c.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String email, phone, firstName, lastName, customFields;
        private Boolean active = true, emailOptOut = false, smsOptOut = false;
        private Integer surveysReceived = 0, surveysCompleted = 0;
        private LocalDateTime lastContactedAt, lastRespondedAt, createdAt, updatedAt;
        private ContactList contactList;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder customFields(String customFields) { this.customFields = customFields; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder emailOptOut(Boolean emailOptOut) { this.emailOptOut = emailOptOut; return this; }
        public Builder smsOptOut(Boolean smsOptOut) { this.smsOptOut = smsOptOut; return this; }
        public Builder surveysReceived(Integer surveysReceived) { this.surveysReceived = surveysReceived; return this; }
        public Builder surveysCompleted(Integer surveysCompleted) { this.surveysCompleted = surveysCompleted; return this; }
        public Builder lastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; return this; }
        public Builder lastRespondedAt(LocalDateTime lastRespondedAt) { this.lastRespondedAt = lastRespondedAt; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder contactList(ContactList contactList) { this.contactList = contactList; return this; }
        
        public Contact build() {
            Contact c = new Contact();
            c.id = this.id; c.email = this.email; c.phone = this.phone;
            c.firstName = this.firstName; c.lastName = this.lastName;
            c.customFields = this.customFields; c.active = this.active;
            c.emailOptOut = this.emailOptOut; c.smsOptOut = this.smsOptOut;
            c.surveysReceived = this.surveysReceived; c.surveysCompleted = this.surveysCompleted;
            c.lastContactedAt = this.lastContactedAt; c.lastRespondedAt = this.lastRespondedAt;
            c.createdAt = this.createdAt; c.updatedAt = this.updatedAt;
            c.contactList = this.contactList;
            return c;
        }
    }
}
