package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "contact_lists")
public class ContactList {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    private Integer contactCount = 0;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @OneToMany(mappedBy = "contactList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Contact> contacts = new ArrayList<>();
    
    public ContactList() {}
    
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
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Integer getContactCount() { return contactCount; }
    public void setContactCount(Integer contactCount) { this.contactCount = contactCount; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    
    public List<Contact> getContacts() { return contacts; }
    public void setContacts(List<Contact> contacts) { this.contacts = contacts; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ContactList cl = (ContactList) o;
        return Objects.equals(id, cl.id);
    }
    
    @Override
    public int hashCode() { return Objects.hash(id); }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String name, description;
        private Integer contactCount = 0;
        private LocalDateTime createdAt, updatedAt;
        private Company company;
        private User createdBy;
        private List<Contact> contacts = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder contactCount(Integer contactCount) { this.contactCount = contactCount; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder company(Company company) { this.company = company; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public Builder contacts(List<Contact> contacts) { this.contacts = contacts; return this; }
        
        public ContactList build() {
            ContactList cl = new ContactList();
            cl.id = this.id; cl.name = this.name; cl.description = this.description;
            cl.contactCount = this.contactCount; cl.createdAt = this.createdAt;
            cl.updatedAt = this.updatedAt; cl.company = this.company;
            cl.createdBy = this.createdBy;
            cl.contacts = this.contacts != null ? this.contacts : new ArrayList<>();
            return cl;
        }
    }
}
