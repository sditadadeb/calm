package com.numia.surveys.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "companies")
public class Company {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(unique = true)
    private String slug;
    
    private String description;
    
    private String industry;
    
    private String website;
    
    private String phone;
    
    private String address;
    
    private String city;
    
    private String country;
    
    // Branding
    private String logoUrl;
    
    private String primaryColor;
    
    private String secondaryColor;
    
    // Plan & Limits
    @Column(nullable = false)
    private String plan = "FREE";
    
    private Integer maxUsers = 5;
    
    private Integer maxSurveys = 10;
    
    private Integer maxResponsesPerMonth = 1000;
    
    private Integer currentMonthResponses = 0;
    
    // Status
    private Boolean active = true;
    
    // Settings (JSON)
    @Column(columnDefinition = "TEXT")
    private String settings;
    
    // Timestamps
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<User> users = new ArrayList<>();
    
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Survey> surveys = new ArrayList<>();
    
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<ContactList> contactLists = new ArrayList<>();
    
    public Company() {}
    
    public Company(Long id, String name, String slug, String description, String industry, 
                   String website, String phone, String address, String city, String country,
                   String logoUrl, String primaryColor, String secondaryColor, String plan,
                   Integer maxUsers, Integer maxSurveys, Integer maxResponsesPerMonth,
                   Integer currentMonthResponses, Boolean active, String settings,
                   LocalDateTime createdAt, LocalDateTime updatedAt, List<User> users,
                   List<Survey> surveys, List<ContactList> contactLists) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.industry = industry;
        this.website = website;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.country = country;
        this.logoUrl = logoUrl;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.plan = plan;
        this.maxUsers = maxUsers;
        this.maxSurveys = maxSurveys;
        this.maxResponsesPerMonth = maxResponsesPerMonth;
        this.currentMonthResponses = currentMonthResponses;
        this.active = active;
        this.settings = settings;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.users = users != null ? users : new ArrayList<>();
        this.surveys = surveys != null ? surveys : new ArrayList<>();
        this.contactLists = contactLists != null ? contactLists : new ArrayList<>();
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (slug == null || slug.isEmpty()) {
            slug = name.toLowerCase().replaceAll("[^a-z0-9]", "-");
        }
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
    
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    
    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
    
    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }
    
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    
    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
    
    public Integer getMaxSurveys() { return maxSurveys; }
    public void setMaxSurveys(Integer maxSurveys) { this.maxSurveys = maxSurveys; }
    
    public Integer getMaxResponsesPerMonth() { return maxResponsesPerMonth; }
    public void setMaxResponsesPerMonth(Integer maxResponsesPerMonth) { this.maxResponsesPerMonth = maxResponsesPerMonth; }
    
    public Integer getCurrentMonthResponses() { return currentMonthResponses; }
    public void setCurrentMonthResponses(Integer currentMonthResponses) { this.currentMonthResponses = currentMonthResponses; }
    
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    
    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<User> getUsers() { return users; }
    public void setUsers(List<User> users) { this.users = users; }
    
    public List<Survey> getSurveys() { return surveys; }
    public void setSurveys(List<Survey> surveys) { this.surveys = surveys; }
    
    public List<ContactList> getContactLists() { return contactLists; }
    public void setContactLists(List<ContactList> contactLists) { this.contactLists = contactLists; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Company company = (Company) o;
        return Objects.equals(id, company.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Company{id=" + id + ", name='" + name + "', slug='" + slug + "'}";
    }
    
    // Builder
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String name;
        private String slug;
        private String description;
        private String industry;
        private String website;
        private String phone;
        private String address;
        private String city;
        private String country;
        private String logoUrl;
        private String primaryColor;
        private String secondaryColor;
        private String plan = "FREE";
        private Integer maxUsers = 5;
        private Integer maxSurveys = 10;
        private Integer maxResponsesPerMonth = 1000;
        private Integer currentMonthResponses = 0;
        private Boolean active = true;
        private String settings;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<User> users = new ArrayList<>();
        private List<Survey> surveys = new ArrayList<>();
        private List<ContactList> contactLists = new ArrayList<>();
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder industry(String industry) { this.industry = industry; return this; }
        public Builder website(String website) { this.website = website; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder city(String city) { this.city = city; return this; }
        public Builder country(String country) { this.country = country; return this; }
        public Builder logoUrl(String logoUrl) { this.logoUrl = logoUrl; return this; }
        public Builder primaryColor(String primaryColor) { this.primaryColor = primaryColor; return this; }
        public Builder secondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; return this; }
        public Builder plan(String plan) { this.plan = plan; return this; }
        public Builder maxUsers(Integer maxUsers) { this.maxUsers = maxUsers; return this; }
        public Builder maxSurveys(Integer maxSurveys) { this.maxSurveys = maxSurveys; return this; }
        public Builder maxResponsesPerMonth(Integer maxResponsesPerMonth) { this.maxResponsesPerMonth = maxResponsesPerMonth; return this; }
        public Builder currentMonthResponses(Integer currentMonthResponses) { this.currentMonthResponses = currentMonthResponses; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder settings(String settings) { this.settings = settings; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder users(List<User> users) { this.users = users; return this; }
        public Builder surveys(List<Survey> surveys) { this.surveys = surveys; return this; }
        public Builder contactLists(List<ContactList> contactLists) { this.contactLists = contactLists; return this; }
        
        public Company build() {
            return new Company(id, name, slug, description, industry, website, phone, address,
                    city, country, logoUrl, primaryColor, secondaryColor, plan, maxUsers,
                    maxSurveys, maxResponsesPerMonth, currentMonthResponses, active, settings,
                    createdAt, updatedAt, users, surveys, contactLists);
        }
    }
}
