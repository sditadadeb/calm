package com.numia.surveys.model;

import com.numia.surveys.model.enums.UserRole;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    private String phone;
    
    private String avatarUrl;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.VIEWER;
    
    private Boolean active = true;
    
    private Boolean emailVerified = false;
    
    private String verificationToken;
    
    private String resetToken;
    
    private LocalDateTime resetTokenExpiry;
    
    private LocalDateTime lastLogin;
    
    @Column(columnDefinition = "TEXT")
    private String preferences;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;
    
    public User() {}
    
    public User(Long id, String email, String password, String firstName, String lastName,
                String phone, String avatarUrl, UserRole role, Boolean active, Boolean emailVerified,
                String verificationToken, String resetToken, LocalDateTime resetTokenExpiry,
                LocalDateTime lastLogin, String preferences, LocalDateTime createdAt,
                LocalDateTime updatedAt, Company company) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.role = role != null ? role : UserRole.VIEWER;
        this.active = active != null ? active : true;
        this.emailVerified = emailVerified != null ? emailVerified : false;
        this.verificationToken = verificationToken;
        this.resetToken = resetToken;
        this.resetTokenExpiry = resetTokenExpiry;
        this.lastLogin = lastLogin;
        this.preferences = preferences;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.company = company;
    }
    
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
        return firstName + " " + lastName;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
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
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "User{id=" + id + ", email='" + email + "'}";
    }
    
    // Builder
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private Long id;
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String phone;
        private String avatarUrl;
        private UserRole role = UserRole.VIEWER;
        private Boolean active = true;
        private Boolean emailVerified = false;
        private String verificationToken;
        private String resetToken;
        private LocalDateTime resetTokenExpiry;
        private LocalDateTime lastLogin;
        private String preferences;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Company company;
        
        public Builder id(Long id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder firstName(String firstName) { this.firstName = firstName; return this; }
        public Builder lastName(String lastName) { this.lastName = lastName; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public Builder role(UserRole role) { this.role = role; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder emailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; return this; }
        public Builder verificationToken(String verificationToken) { this.verificationToken = verificationToken; return this; }
        public Builder resetToken(String resetToken) { this.resetToken = resetToken; return this; }
        public Builder resetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; return this; }
        public Builder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public Builder preferences(String preferences) { this.preferences = preferences; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder company(Company company) { this.company = company; return this; }
        
        public User build() {
            return new User(id, email, password, firstName, lastName, phone, avatarUrl,
                    role, active, emailVerified, verificationToken, resetToken, resetTokenExpiry,
                    lastLogin, preferences, createdAt, updatedAt, company);
        }
    }
}
