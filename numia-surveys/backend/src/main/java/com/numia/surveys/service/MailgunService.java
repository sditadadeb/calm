package com.numia.surveys.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class MailgunService {
    
    private static final Logger log = LoggerFactory.getLogger(MailgunService.class);
    
    @Value("${mailgun.api-key}")
    private String apiKey;
    
    @Value("${mailgun.domain}")
    private String domain;
    
    @Value("${mailgun.from}")
    private String from;
    
    @Value("${mailgun.base-url}")
    private String baseUrl;
    
    private final WebClient.Builder webClientBuilder;
    
    public MailgunService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }
    
    public CompletableFuture<MailResponse> sendEmail(String to, String subject, String htmlContent, Map<String, String> variables) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                WebClient webClient = webClientBuilder
                        .baseUrl(baseUrl)
                        .defaultHeader(HttpHeaders.AUTHORIZATION, 
                                "Basic " + Base64.getEncoder().encodeToString(("api:" + apiKey).getBytes()))
                        .build();
                
                String processedContent = htmlContent;
                if (variables != null) {
                    for (Map.Entry<String, String> entry : variables.entrySet()) {
                        processedContent = processedContent.replace("{{" + entry.getKey() + "}}", entry.getValue());
                    }
                }
                
                MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
                formData.add("from", from);
                formData.add("to", to);
                formData.add("subject", subject);
                formData.add("html", processedContent);
                formData.add("o:tracking", "yes");
                formData.add("o:tracking-clicks", "yes");
                formData.add("o:tracking-opens", "yes");
                
                String response = webClient.post()
                        .uri("/" + domain + "/messages")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                
                log.info("Email enviado a {}: {}", to, response);
                return new MailResponse(true, response, null);
                
            } catch (Exception e) {
                log.error("Error enviando email a {}: {}", to, e.getMessage());
                return new MailResponse(false, null, e.getMessage());
            }
        });
    }
    
    public CompletableFuture<MailResponse> sendSurveyInvitation(
            String to, String recipientName, String surveyTitle, String surveyUrl,
            String senderName, String customMessage) {
        String subject = "Invitación a encuesta: " + surveyTitle;
        
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{{surveyTitle}}</h1>
                    </div>
                    <div class="content">
                        <p>Hola {{recipientName}},</p>
                        <p>{{customMessage}}</p>
                        <p>Te invitamos a completar la siguiente encuesta. Tu opinión es muy importante para nosotros.</p>
                        <center>
                            <a href="{{surveyUrl}}" class="button">Completar Encuesta</a>
                        </center>
                        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; font-size: 12px; color: #666;">{{surveyUrl}}</p>
                        <p>Gracias por tu tiempo.</p>
                        <p>Saludos,<br>{{senderName}}</p>
                    </div>
                    <div class="footer">
                        <p>Este email fue enviado por Numia Surveys</p>
                    </div>
                </div>
            </body>
            </html>
            """;
        
        Map<String, String> variables = Map.of(
                "recipientName", recipientName != null ? recipientName : "Usuario",
                "surveyTitle", surveyTitle,
                "surveyUrl", surveyUrl,
                "senderName", senderName != null ? senderName : "El equipo",
                "customMessage", customMessage != null ? customMessage : ""
        );
        
        return sendEmail(to, subject, htmlContent, variables);
    }
    
    public record MailResponse(boolean success, String messageId, String error) {}
}
