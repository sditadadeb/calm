package com.numia.surveys.model.enums;

public enum QuestionType {
    // Basic Types
    SHORT_TEXT,         // Single line text input
    LONG_TEXT,          // Multi-line text area
    SINGLE_CHOICE,      // Radio buttons
    MULTIPLE_CHOICE,    // Checkboxes
    DROPDOWN,           // Select dropdown
    
    // Rating Types
    NPS,                // Net Promoter Score (0-10)
    CSAT,               // Customer Satisfaction (1-5 stars)
    CES,                // Customer Effort Score (1-7)
    RATING_SCALE,       // Custom scale rating
    STAR_RATING,        // Star rating (1-5)
    
    // Advanced Types
    MATRIX_SINGLE,      // Matrix with single choice per row
    MATRIX_MULTIPLE,    // Matrix with multiple choices per row
    RANKING,            // Drag & drop ranking
    SLIDER,             // Numeric slider
    DATE,               // Date picker
    TIME,               // Time picker
    DATETIME,           // Date and time picker
    FILE_UPLOAD,        // File attachment
    
    // Special Types
    EMAIL,              // Email input with validation
    PHONE,              // Phone number input
    NUMBER,             // Numeric input
    SIGNATURE,          // Digital signature
    IMAGE_CHOICE        // Image-based selection
}

