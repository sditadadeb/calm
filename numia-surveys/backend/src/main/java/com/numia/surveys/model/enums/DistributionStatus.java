package com.numia.surveys.model.enums;

public enum DistributionStatus {
    PENDING,        // Scheduled but not sent
    IN_PROGRESS,    // Currently being sent
    COMPLETED,      // All messages sent
    FAILED,         // Failed to send
    CANCELLED       // Cancelled before completion
}

