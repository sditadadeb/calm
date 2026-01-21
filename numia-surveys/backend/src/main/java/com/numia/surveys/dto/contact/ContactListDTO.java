package com.numia.surveys.dto.contact;

import com.numia.surveys.model.ContactList;
import java.time.LocalDateTime;

public class ContactListDTO {
    private Long id;
    private String name;
    private String description;
    private Integer contactCount;
    private Long companyId;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public ContactListDTO() {}
    
    public static ContactListDTO fromEntity(ContactList cl) {
        ContactListDTO dto = new ContactListDTO();
        dto.id = cl.getId();
        dto.name = cl.getName();
        dto.description = cl.getDescription();
        dto.contactCount = cl.getContactCount();
        dto.companyId = cl.getCompany() != null ? cl.getCompany().getId() : null;
        dto.createdByName = cl.getCreatedBy() != null ? cl.getCreatedBy().getFullName() : null;
        dto.createdAt = cl.getCreatedAt();
        dto.updatedAt = cl.getUpdatedAt();
        return dto;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getContactCount() { return contactCount; }
    public void setContactCount(Integer contactCount) { this.contactCount = contactCount; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
