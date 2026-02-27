package com.calm.admin.dto;

public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private Long sellerId;
    private String sellerName;
    private long expiresIn;

    public LoginResponse() {
    }

    public LoginResponse(String token, String username, String role, Long sellerId, String sellerName, long expiresIn) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.expiresIn = expiresIn;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }

    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
}

