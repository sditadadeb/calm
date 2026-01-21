package com.numia.surveys.dto.auth;

import com.numia.surveys.dto.user.UserDTO;

public class AuthResponse {
    private String token;
    private String tokenType;
    private Long expiresIn;
    private UserDTO user;
    
    public AuthResponse() {}
    
    public AuthResponse(String token, String tokenType, Long expiresIn, UserDTO user) {
        this.token = token;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    
    public Long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }
    
    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private String token, tokenType;
        private Long expiresIn;
        private UserDTO user;
        
        public Builder token(String token) { this.token = token; return this; }
        public Builder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public Builder expiresIn(Long expiresIn) { this.expiresIn = expiresIn; return this; }
        public Builder user(UserDTO user) { this.user = user; return this; }
        
        public AuthResponse build() {
            return new AuthResponse(token, tokenType, expiresIn, user);
        }
    }
}
