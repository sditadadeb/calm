package com.numia.surveys.model.enums;

public enum DistributionChannel {
    EMAIL,      // Via Mailgun
    SMS,        // Via Bulk SMS
    WHATSAPP,   // Via WhatsApp Business API (Phase 2)
    LINK,       // Direct link sharing
    QR_CODE,    // QR code generation
    EMBED       // Website embed
}

