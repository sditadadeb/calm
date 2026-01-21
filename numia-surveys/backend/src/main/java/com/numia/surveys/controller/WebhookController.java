package com.numia.surveys.controller;

import com.numia.surveys.service.DistributionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {
    
    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    
    private final DistributionService distributionService;
    
    public WebhookController(DistributionService distributionService) {
        this.distributionService = distributionService;
    }
    
    /**
     * Mailgun webhook endpoint for email tracking events.
     * Configure in Mailgun dashboard: https://app.mailgun.com/app/webhooks
     */
    @PostMapping("/mailgun")
    public ResponseEntity<String> handleMailgunWebhook(@RequestBody Map<String, Object> payload) {
        try {
            log.debug("Mailgun webhook received: {}", payload);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> eventData = (Map<String, Object>) payload.get("event-data");
            if (eventData != null) {
                String event = (String) eventData.get("event");
                
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) eventData.get("message");
                if (message != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> headers = (Map<String, Object>) message.get("headers");
                    if (headers != null) {
                        String messageId = (String) headers.get("message-id");
                        if (messageId != null && event != null) {
                            distributionService.handleEmailWebhook(messageId, event);
                        }
                    }
                }
            }
            
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing Mailgun webhook: {}", e.getMessage());
            return ResponseEntity.ok("OK"); // Always return OK to avoid retries
        }
    }
    
    /**
     * BulkSMS webhook endpoint for delivery reports.
     * Configure in BulkSMS dashboard
     */
    @PostMapping("/bulksms")
    public ResponseEntity<String> handleBulkSmsWebhook(@RequestBody Map<String, Object> payload) {
        try {
            log.debug("BulkSMS webhook received: {}", payload);
            
            // Process delivery report
            // BulkSMS webhook format varies - implement based on their documentation
            
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing BulkSMS webhook: {}", e.getMessage());
            return ResponseEntity.ok("OK");
        }
    }
}
