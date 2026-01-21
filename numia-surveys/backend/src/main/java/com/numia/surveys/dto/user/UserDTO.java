package com.numia.surveys.dto.user;

import com.numia.surveys.model.User;
import com.numia.surveys.model.enums.UserRole;
import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private UserRole role;
    private Boolean active;
    private Boolean emailVerified;
    private Long companyId;
    private String companyName;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    
    public UserDTO() {}
    
    public UserDTO(Long id, String email, String firstName, String lastName, String phone,
                   String avatarUrl, UserRole role, Boolean active, Boolean emailVerified,
                   Long companyId, String companyName, LocalDateTime lastLogin, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.active = active;
        this.emailVerified = emailVerified;
        this.companyId = companyId;
        this.companyName = companyName;
        this.lastLogin = lastLogin;
        this.createdAt = createdAt;
    }
    
    public static UserDTO fromEntity(User user) {
        return builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .active(user.getActive())
                .emailVerified(user.getEmailVerified())
                .companyId(user.getCompany() != null ? user.getCompany().getId() : null)
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id, companyId;
        private String email, firstName, lastName, phone, avatarUrl, companyName;
        private UserRole role;
        private Boolean active, emailVerified;
        private LocalDateTime lastLogin, createdAt;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public Builder role(UserRole role) { this.role = role; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder emailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; return this; }
        public Builder companyId(Long companyId) { this.companyId = companyId; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        
        public UserDTO build() {
            return new UserDTO(id, email, firstName, lastName, phone, avatarUrl, role,
                    active, emailVerified, companyId, companyName, lastLogin, createdAt);
        }
    }
}
