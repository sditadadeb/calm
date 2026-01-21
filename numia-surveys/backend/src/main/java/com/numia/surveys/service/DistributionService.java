package com.numia.surveys.service;

import com.numia.surveys.dto.distribution.CreateDistributionRequest;
import com.numia.surveys.dto.distribution.DistributionDTO;
import com.numia.surveys.model.*;
import com.numia.surveys.model.enums.DistributionChannel;
import com.numia.surveys.model.enums.DistributionStatus;
import com.numia.surveys.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistributionService {
    
    private static final Logger log = LoggerFactory.getLogger(DistributionService.class);
    
    private final DistributionRepository distributionRepository;
    private final DistributionLogRepository distributionLogRepository;
    private final SurveyRepository surveyRepository;
    private final ContactListRepository contactListRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final MailgunService mailgunService;
    private final BulkGateService bulkGateService;
    
    @Value("${survey.base-url}")
    private String surveyBaseUrl;
    
    public DistributionService(DistributionRepository distributionRepository, DistributionLogRepository distributionLogRepository,
                               SurveyRepository surveyRepository, ContactListRepository contactListRepository,
                               ContactRepository contactRepository, UserRepository userRepository,
                               MailgunService mailgunService, BulkGateService bulkGateService) {
        this.distributionRepository = distributionRepository;
        this.distributionLogRepository = distributionLogRepository;
        this.surveyRepository = surveyRepository;
        this.contactListRepository = contactListRepository;
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.mailgunService = mailgunService;
        this.bulkGateService = bulkGateService;
    }
    
    @Transactional
    public DistributionDTO createDistribution(CreateDistributionRequest request, Long companyId, Long userId) {
        Survey survey = surveyRepository.findById(request.getSurveyId())
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        ContactList contactList = contactListRepository.findById(request.getContactListId())
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Distribution distribution = Distribution.builder()
                .name(request.getName())
                .channel(request.getChannel())
                .status(DistributionStatus.PENDING)
                .subject(request.getSubject())
                .messageTemplate(request.getMessageTemplate())
                .senderName(request.getSenderName())
                .replyTo(request.getReplyTo())
                .scheduledAt(request.getScheduledAt())
                .survey(survey)
                .contactList(contactList)
                .createdBy(user)
                .build();
        
        List<Contact> recipients;
        if (request.getChannel() == DistributionChannel.EMAIL) {
            recipients = contactRepository.findEmailableByContactListId(contactList.getId());
        } else if (request.getChannel() == DistributionChannel.SMS) {
            recipients = contactRepository.findSmsableByContactListId(contactList.getId());
        } else {
            recipients = contactRepository.findByContactListIdAndActiveTrue(contactList.getId());
        }
        
        distribution.setTotalRecipients(recipients.size());
        distribution = distributionRepository.save(distribution);
        
        for (Contact contact : recipients) {
            DistributionLog logEntry = DistributionLog.builder()
                    .distribution(distribution)
                    .contact(contact)
                    .recipientEmail(contact.getEmail())
                    .recipientPhone(contact.getPhone())
                    .build();
            distributionLogRepository.save(logEntry);
        }
        
        if (Boolean.TRUE.equals(request.getSendImmediately())) {
            sendDistribution(distribution.getId());
        }
        
        return DistributionDTO.fromEntity(distribution);
    }
    
    @Async
    @Transactional
    public void sendDistribution(Long distributionId) {
        Distribution distribution = distributionRepository.findById(distributionId)
                .orElseThrow(() -> new RuntimeException("Distribución no encontrada"));
        
        if (distribution.getStatus() != DistributionStatus.PENDING) {
            log.warn("La distribución {} no está pendiente", distributionId);
            return;
        }
        
        distribution.setStatus(DistributionStatus.IN_PROGRESS);
        distribution.setSentAt(LocalDateTime.now());
        distributionRepository.save(distribution);
        
        List<DistributionLog> logs = distributionLogRepository.findByDistributionId(distributionId);
        String surveyUrl = surveyBaseUrl + "/" + distribution.getSurvey().getPublicId();
        
        int successCount = 0;
        int failCount = 0;
        
        for (DistributionLog logEntry : logs) {
            try {
                if (distribution.getChannel() == DistributionChannel.EMAIL) {
                    var result = mailgunService.sendSurveyInvitation(
                            logEntry.getRecipientEmail(),
                            logEntry.getContact() != null ? logEntry.getContact().getFullName() : null,
                            distribution.getSurvey().getTitle(),
                            surveyUrl,
                            distribution.getSenderName(),
                            distribution.getMessageTemplate()
                    ).join();
                    
                    if (result.success()) {
                        logEntry.setSent(true);
                        logEntry.setSentAt(LocalDateTime.now());
                        logEntry.setExternalMessageId(result.messageId());
                        successCount++;
                    } else {
                        logEntry.setErrorMessage(result.error());
                        failCount++;
                    }
                    
                } else if (distribution.getChannel() == DistributionChannel.SMS) {
                    var result = bulkGateService.sendSurveyInvitation(
                            logEntry.getRecipientPhone(),
                            logEntry.getContact() != null ? logEntry.getContact().getFullName() : null,
                            distribution.getSurvey().getTitle(),
                            surveyUrl
                    ).join();
                    
                    if (result.success()) {
                        logEntry.setSent(true);
                        logEntry.setSentAt(LocalDateTime.now());
                        logEntry.setExternalMessageId(result.messageId());
                        successCount++;
                    } else {
                        logEntry.setErrorMessage(result.error());
                        failCount++;
                    }
                }
                
                distributionLogRepository.save(logEntry);
                
                if (logEntry.getContact() != null) {
                    Contact contact = logEntry.getContact();
                    contact.setSurveysReceived(contact.getSurveysReceived() + 1);
                    contact.setLastContactedAt(LocalDateTime.now());
                    contactRepository.save(contact);
                }
                
                Thread.sleep(100);
                
            } catch (Exception e) {
                log.error("Error enviando a {}: {}", 
                        logEntry.getRecipientEmail() != null ? logEntry.getRecipientEmail() : logEntry.getRecipientPhone(), 
                        e.getMessage());
                logEntry.setErrorMessage(e.getMessage());
                distributionLogRepository.save(logEntry);
                failCount++;
            }
        }
        
        distribution.setSentCount(successCount);
        distribution.setFailedCount(failCount);
        distribution.setStatus(DistributionStatus.COMPLETED);
        distribution.setCompletedAt(LocalDateTime.now());
        distributionRepository.save(distribution);
        
        log.info("Distribución {} completada: {} enviados, {} fallidos", distributionId, successCount, failCount);
    }
    
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledDistributions() {
        List<Distribution> scheduled = distributionRepository.findScheduledDistributionsToSend(LocalDateTime.now());
        for (Distribution distribution : scheduled) {
            log.info("Procesando distribución programada: {}", distribution.getId());
            sendDistribution(distribution.getId());
        }
    }
    
    public List<DistributionDTO> getDistributionsBySurvey(Long surveyId, Long companyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Encuesta no encontrada"));
        
        if (!survey.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta encuesta");
        }
        
        return distributionRepository.findBySurveyIdOrderByCreatedAtDesc(surveyId).stream()
                .map(DistributionDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<DistributionDTO> getDistributionsByCompany(Long companyId) {
        return distributionRepository.findByCompanyId(companyId).stream()
                .map(DistributionDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public DistributionDTO getDistribution(Long distributionId, Long companyId) {
        Distribution distribution = distributionRepository.findById(distributionId)
                .orElseThrow(() -> new RuntimeException("Distribución no encontrada"));
        
        if (!distribution.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta distribución");
        }
        
        return DistributionDTO.fromEntity(distribution);
    }
    
    @Transactional
    public void cancelDistribution(Long distributionId, Long companyId) {
        Distribution distribution = distributionRepository.findById(distributionId)
                .orElseThrow(() -> new RuntimeException("Distribución no encontrada"));
        
        if (!distribution.getSurvey().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta distribución");
        }
        
        if (distribution.getStatus() != DistributionStatus.PENDING) {
            throw new RuntimeException("Solo se pueden cancelar distribuciones pendientes");
        }
        
        distribution.setStatus(DistributionStatus.CANCELLED);
        distributionRepository.save(distribution);
    }
    
    @Transactional
    public void handleEmailWebhook(String messageId, String event) {
        distributionLogRepository.findByExternalMessageId(messageId).ifPresent(logEntry -> {
            switch (event.toLowerCase()) {
                case "delivered" -> {
                    logEntry.setDelivered(true);
                    logEntry.setDeliveredAt(LocalDateTime.now());
                    updateDistributionStats(logEntry.getDistribution().getId(), "delivered");
                }
                case "opened" -> {
                    logEntry.setOpened(true);
                    logEntry.setOpenedAt(LocalDateTime.now());
                    updateDistributionStats(logEntry.getDistribution().getId(), "opened");
                }
                case "clicked" -> {
                    logEntry.setClicked(true);
                    logEntry.setClickedAt(LocalDateTime.now());
                    updateDistributionStats(logEntry.getDistribution().getId(), "clicked");
                }
                case "bounced", "failed" -> {
                    logEntry.setBounced(true);
                    updateDistributionStats(logEntry.getDistribution().getId(), "bounced");
                }
                case "unsubscribed" -> {
                    logEntry.setUnsubscribed(true);
                    updateDistributionStats(logEntry.getDistribution().getId(), "unsubscribed");
                    if (logEntry.getContact() != null) {
                        logEntry.getContact().setEmailOptOut(true);
                        contactRepository.save(logEntry.getContact());
                    }
                }
            }
            distributionLogRepository.save(logEntry);
        });
    }
    
    private void updateDistributionStats(Long distributionId, String stat) {
        Distribution distribution = distributionRepository.findById(distributionId).orElse(null);
        if (distribution != null) {
            switch (stat) {
                case "delivered" -> distribution.setDeliveredCount(distribution.getDeliveredCount() + 1);
                case "opened" -> distribution.setOpenedCount(distribution.getOpenedCount() + 1);
                case "clicked" -> distribution.setClickedCount(distribution.getClickedCount() + 1);
                case "bounced" -> distribution.setBouncedCount(distribution.getBouncedCount() + 1);
                case "unsubscribed" -> distribution.setUnsubscribedCount(distribution.getUnsubscribedCount() + 1);
            }
            distributionRepository.save(distribution);
        }
    }
}
