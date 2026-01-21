package com.numia.surveys.dto.contact;

public class CreateContactRequest {
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String customFields;
    
    public CreateContactRequest() {}
    
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
}
