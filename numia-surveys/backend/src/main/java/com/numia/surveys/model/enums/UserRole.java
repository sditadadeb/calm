package com.numia.surveys.model.enums;

public enum UserRole {
    SUPER_ADMIN,    // Platform administrator
    COMPANY_ADMIN,  // Company administrator
    MANAGER,        // Can create/edit surveys
    ANALYST,        // Can view reports only
    VIEWER          // Basic read access
}

