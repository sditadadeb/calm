package com.numia.surveys.dto.company;

import jakarta.validation.constraints.NotBlank;

public class CreateCompanyRequest {
    
    @NotBlank(message = "El nombre de la compañía es requerido")
    private String name;
    
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
    
    public CreateCompanyRequest() {}
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
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
}
