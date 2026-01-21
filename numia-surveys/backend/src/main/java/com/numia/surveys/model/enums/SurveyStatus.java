package com.numia.surveys.model.enums;

public enum SurveyStatus {
    DRAFT,          // Being created/edited
    ACTIVE,         // Published and accepting responses
    PAUSED,         // Temporarily stopped
    CLOSED,         // No longer accepting responses
    ARCHIVED        // Hidden from active lists
}

