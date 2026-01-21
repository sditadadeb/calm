package com.numia.surveys.dto.company;

import com.numia.surveys.model.Company;
import java.time.LocalDateTime;

public class CompanyDTO {
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
    private String plan;
    private Integer maxUsers;
    private Integer maxSurveys;
    private Integer maxResponsesPerMonth;
    private Integer currentMonthResponses;
    private Boolean active;
    private Integer userCount;
    private Integer surveyCount;
    private LocalDateTime createdAt;
    
    public CompanyDTO() {}
    
    public static CompanyDTO fromEntity(Company company) {
        CompanyDTO dto = new CompanyDTO();
        dto.id = company.getId();
        dto.name = company.getName();
        dto.slug = company.getSlug();
        dto.description = company.getDescription();
        dto.industry = company.getIndustry();
        dto.website = company.getWebsite();
        dto.phone = company.getPhone();
        dto.address = company.getAddress();
        dto.city = company.getCity();
        dto.country = company.getCountry();
        dto.logoUrl = company.getLogoUrl();
        dto.primaryColor = company.getPrimaryColor();
        dto.secondaryColor = company.getSecondaryColor();
        dto.plan = company.getPlan();
        dto.maxUsers = company.getMaxUsers();
        dto.maxSurveys = company.getMaxSurveys();
        dto.maxResponsesPerMonth = company.getMaxResponsesPerMonth();
        dto.currentMonthResponses = company.getCurrentMonthResponses();
        dto.active = company.getActive();
        dto.userCount = company.getUsers() != null ? company.getUsers().size() : 0;
        dto.surveyCount = company.getSurveys() != null ? company.getSurveys().size() : 0;
        dto.createdAt = company.getCreatedAt();
        return dto;
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
    
    public Integer getUserCount() { return userCount; }
    public void setUserCount(Integer userCount) { this.userCount = userCount; }
    
    public Integer getSurveyCount() { return surveyCount; }
    public void setSurveyCount(Integer surveyCount) { this.surveyCount = surveyCount; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private final CompanyDTO dto = new CompanyDTO();
        
        public Builder id(Long id) { dto.id = id; return this; }
        public Builder name(String name) { dto.name = name; return this; }
        public Builder slug(String slug) { dto.slug = slug; return this; }
        public Builder description(String description) { dto.description = description; return this; }
        public Builder industry(String industry) { dto.industry = industry; return this; }
        public Builder website(String website) { dto.website = website; return this; }
        public Builder phone(String phone) { dto.phone = phone; return this; }
        public Builder address(String address) { dto.address = address; return this; }
        public Builder city(String city) { dto.city = city; return this; }
        public Builder country(String country) { dto.country = country; return this; }
        public Builder logoUrl(String logoUrl) { dto.logoUrl = logoUrl; return this; }
        public Builder primaryColor(String primaryColor) { dto.primaryColor = primaryColor; return this; }
        public Builder secondaryColor(String secondaryColor) { dto.secondaryColor = secondaryColor; return this; }
        public Builder plan(String plan) { dto.plan = plan; return this; }
        public Builder maxUsers(Integer maxUsers) { dto.maxUsers = maxUsers; return this; }
        public Builder maxSurveys(Integer maxSurveys) { dto.maxSurveys = maxSurveys; return this; }
        public Builder maxResponsesPerMonth(Integer maxResponsesPerMonth) { dto.maxResponsesPerMonth = maxResponsesPerMonth; return this; }
        public Builder currentMonthResponses(Integer currentMonthResponses) { dto.currentMonthResponses = currentMonthResponses; return this; }
        public Builder active(Boolean active) { dto.active = active; return this; }
        public Builder userCount(Integer userCount) { dto.userCount = userCount; return this; }
        public Builder surveyCount(Integer surveyCount) { dto.surveyCount = surveyCount; return this; }
        public Builder createdAt(LocalDateTime createdAt) { dto.createdAt = createdAt; return this; }
        
        public CompanyDTO build() { return dto; }
    }
}
