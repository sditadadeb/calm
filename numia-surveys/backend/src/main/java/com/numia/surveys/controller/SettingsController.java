package com.numia.surveys.controller;

import com.numia.surveys.model.Company;
import com.numia.surveys.repository.CompanyRepository;
import com.numia.surveys.service.BulkGateService;
import com.numia.surveys.service.MailgunService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    
    private static final Logger log = LoggerFactory.getLogger(SettingsController.class);
    
    private final CompanyRepository companyRepository;
    private final BulkGateService bulkGateService;
    private final MailgunService mailgunService;
    
    @Value("${bulkgate.application-id}")
    private String bulkgateAppId;
    
    @Value("${bulkgate.application-token}")
    private String bulkgateAppToken;
    
    @Value("${mailgun.api-key}")
    private String mailgunApiKey;
    
    public SettingsController(CompanyRepository companyRepository, 
                              BulkGateService bulkGateService,
                              MailgunService mailgunService) {
        this.companyRepository = companyRepository;
        this.bulkGateService = bulkGateService;
        this.mailgunService = mailgunService;
    }
    
    @GetMapping("/status")
    public ResponseEntity<?> getConfigStatus(HttpServletRequest httpRequest) {
        Map<String, Object> status = new HashMap<>();
        
        // Check SMS config (BulkGate)
        boolean smsConfigured = bulkgateAppId != null && 
                               !bulkgateAppId.isEmpty();
        status.put("smsConfigured", smsConfigured);
        status.put("smsProvider", "BulkGate");
        
        // Include actual BulkGate credentials for debugging
        status.put("bulksmsTokenId", bulkgateAppId);
        status.put("bulksmsTokenSecret", bulkgateAppToken);
        
        // Check Email config
        boolean mailConfigured = mailgunApiKey != null && 
                                !mailgunApiKey.equals("your-mailgun-api-key") && 
                                !mailgunApiKey.isEmpty();
        status.put("mailConfigured", mailConfigured);
        status.put("mailProvider", "Mailgun");
        
        return ResponseEntity.ok(status);
    }
    
    @PostMapping("/test-sms")
    public ResponseEntity<?> testSms(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        
        if (companyId == null) {
            log.warn("Intento de enviar SMS sin companyId en request");
            return ResponseEntity.badRequest().body(Map.of("message", "No autorizado - companyId no encontrado"));
        }
        
        String phone = request.get("phone");
        if (phone == null || phone.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Número de teléfono requerido"));
        }
        
        log.info("========================================");
        log.info("INICIANDO TEST DE SMS");
        log.info("Teléfono destino: {}", phone);
        log.info("CompanyId: {}", companyId);
        log.info("========================================");
        
        try {
            var result = bulkGateService.sendSms(phone, "Test SMS from Numia Surveys. Configuration OK!").join();
            
            log.info("Resultado del envío:");
            log.info("  - Success: {}", result.success());
            log.info("  - MessageId/Response: {}", result.messageId());
            log.info("  - Error: {}", result.error());
            
            if (result.success()) {
                log.info("✅ SMS de prueba enviado exitosamente a {}", phone);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "SMS enviado correctamente. Respuesta API: " + (result.messageId() != null ? result.messageId() : "OK"),
                    "response", result.messageId() != null ? result.messageId() : "N/A"
                ));
            } else {
                log.error("❌ Error enviando SMS de prueba: {}", result.error());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Error enviando SMS: " + result.error(),
                    "error", result.error() != null ? result.error() : "Error desconocido"
                ));
            }
        } catch (Exception e) {
            log.error("❌ Excepción enviando SMS de prueba: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage(),
                "errorType", e.getClass().getSimpleName()
            ));
        }
    }
    
    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        
        if (companyId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No autorizado"));
        }
        
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email requerido"));
        }
        
        log.info("Enviando email de prueba a: {}", email);
        
        try {
            var result = mailgunService.sendEmail(
                email, 
                "Prueba de Email - Numia Surveys", 
                "<h1>¡Hola!</h1><p>Este es un email de prueba desde Numia Surveys.</p><p>Si recibes este mensaje, la configuración de Mailgun es correcta.</p>",
                null
            ).join();
            
            if (result.success()) {
                log.info("Email de prueba enviado exitosamente a {}", email);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email enviado correctamente"
                ));
            } else {
                log.error("Error enviando email de prueba: {}", result.error());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Error enviando email: " + result.error()
                ));
            }
        } catch (Exception e) {
            log.error("Excepción enviando email de prueba: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    @PutMapping("/company")
    public ResponseEntity<?> updateCompanySettings(
            @RequestBody Map<String, Object> settings,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        
        if (companyId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No tienes acceso a esta configuración"));
        }
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Compañía no encontrada"));
        
        if (settings.containsKey("name")) {
            company.setName((String) settings.get("name"));
        }
        if (settings.containsKey("website")) {
            company.setWebsite((String) settings.get("website"));
        }
        if (settings.containsKey("industry")) {
            company.setIndustry((String) settings.get("industry"));
        }
        if (settings.containsKey("logoUrl")) {
            company.setLogoUrl((String) settings.get("logoUrl"));
        }
        if (settings.containsKey("primaryColor")) {
            company.setPrimaryColor((String) settings.get("primaryColor"));
        }
        if (settings.containsKey("secondaryColor")) {
            company.setSecondaryColor((String) settings.get("secondaryColor"));
        }
        
        companyRepository.save(company);
        return ResponseEntity.ok(Map.of("message", "Configuración guardada"));
    }
    
    @PutMapping("/mail")
    public ResponseEntity<?> updateMailSettings(
            @RequestBody Map<String, Object> settings,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        
        if (companyId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No tienes acceso a esta configuración"));
        }
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Compañía no encontrada"));
        
        // Store mail settings as JSON in the settings field
        String existingSettings = company.getSettings() != null ? company.getSettings() : "{}";
        // In a real implementation, you would parse and merge the JSON properly
        // For now, we store the entire mail config
        StringBuilder newSettings = new StringBuilder();
        newSettings.append("{\"mail\":{");
        if (settings.containsKey("mailgunApiKey")) {
            newSettings.append("\"mailgunApiKey\":\"").append(settings.get("mailgunApiKey")).append("\",");
        }
        if (settings.containsKey("mailgunDomain")) {
            newSettings.append("\"mailgunDomain\":\"").append(settings.get("mailgunDomain")).append("\",");
        }
        if (settings.containsKey("mailgunFromEmail")) {
            newSettings.append("\"mailgunFromEmail\":\"").append(settings.get("mailgunFromEmail")).append("\",");
        }
        if (settings.containsKey("mailgunFromName")) {
            newSettings.append("\"mailgunFromName\":\"").append(settings.get("mailgunFromName")).append("\"");
        }
        newSettings.append("}}");
        
        company.setSettings(newSettings.toString());
        companyRepository.save(company);
        
        return ResponseEntity.ok(Map.of("message", "Configuración de email guardada"));
    }
    
    @PutMapping("/sms")
    public ResponseEntity<?> updateSmsSettings(
            @RequestBody Map<String, Object> settings,
            HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        
        if (companyId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No tienes acceso a esta configuración"));
        }
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Compañía no encontrada"));
        
        // Store SMS settings as JSON in the settings field
        StringBuilder newSettings = new StringBuilder();
        newSettings.append("{\"sms\":{");
        if (settings.containsKey("bulksmsTokenId")) {
            newSettings.append("\"bulksmsTokenId\":\"").append(settings.get("bulksmsTokenId")).append("\",");
        }
        if (settings.containsKey("bulksmsTokenSecret")) {
            newSettings.append("\"bulksmsTokenSecret\":\"").append(settings.get("bulksmsTokenSecret")).append("\",");
        }
        if (settings.containsKey("bulksmsFromNumber")) {
            newSettings.append("\"bulksmsFromNumber\":\"").append(settings.get("bulksmsFromNumber")).append("\"");
        }
        newSettings.append("}}");
        
        company.setSettings(newSettings.toString());
        companyRepository.save(company);
        
        return ResponseEntity.ok(Map.of("message", "Configuración de SMS guardada"));
    }
}

