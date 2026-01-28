package com.calm.admin.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "advanced_analysis")
public class AdvancedAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String recordingId;
    
    // Conversation Flow - porcentajes de cada fase
    private Integer aperturaPercent;
    private Integer descubrimientoPercent;
    private Integer objecionPercent;
    private Integer argumentoPercent;
    private Integer cierrePercent;
    private Integer silencioPercent;
    
    // Customer Confidence Score (0-100)
    private Integer customerConfidenceScore;
    
    // Métricas del vendedor
    private Integer vendorTalkPercent; // % tiempo hablando el vendedor
    private Integer activeListeningScore; // 0-100
    private Integer objectionHandlingScore; // 0-100
    private Integer closingRhythmScore; // 0-100
    private Integer empathyScore; // 0-100
    
    // Clasificación de objeciones
    private Integer explicitObjections;
    private Integer implicitObjections;
    private Integer unansweredObjections;
    private Integer ineffectiveResponses;
    
    // Loss moments
    @Column(length = 500)
    private String keyAbandonPhrase; // Frase clave antes del abandono
    private Integer abandonMinute; // Minuto aproximado donde cae la intención
    
    // Metadata
    private LocalDateTime analyzedAt;
    
    @Column(length = 1000)
    private String rawAnalysisJson; // JSON completo de la respuesta de GPT
    
    // Constructors
    public AdvancedAnalysis() {}
    
    public AdvancedAnalysis(String recordingId) {
        this.recordingId = recordingId;
        this.analyzedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRecordingId() { return recordingId; }
    public void setRecordingId(String recordingId) { this.recordingId = recordingId; }
    
    public Integer getAperturaPercent() { return aperturaPercent; }
    public void setAperturaPercent(Integer aperturaPercent) { this.aperturaPercent = aperturaPercent; }
    
    public Integer getDescubrimientoPercent() { return descubrimientoPercent; }
    public void setDescubrimientoPercent(Integer descubrimientoPercent) { this.descubrimientoPercent = descubrimientoPercent; }
    
    public Integer getObjecionPercent() { return objecionPercent; }
    public void setObjecionPercent(Integer objecionPercent) { this.objecionPercent = objecionPercent; }
    
    public Integer getArgumentoPercent() { return argumentoPercent; }
    public void setArgumentoPercent(Integer argumentoPercent) { this.argumentoPercent = argumentoPercent; }
    
    public Integer getCierrePercent() { return cierrePercent; }
    public void setCierrePercent(Integer cierrePercent) { this.cierrePercent = cierrePercent; }
    
    public Integer getSilencioPercent() { return silencioPercent; }
    public void setSilencioPercent(Integer silencioPercent) { this.silencioPercent = silencioPercent; }
    
    public Integer getCustomerConfidenceScore() { return customerConfidenceScore; }
    public void setCustomerConfidenceScore(Integer customerConfidenceScore) { this.customerConfidenceScore = customerConfidenceScore; }
    
    public Integer getVendorTalkPercent() { return vendorTalkPercent; }
    public void setVendorTalkPercent(Integer vendorTalkPercent) { this.vendorTalkPercent = vendorTalkPercent; }
    
    public Integer getActiveListeningScore() { return activeListeningScore; }
    public void setActiveListeningScore(Integer activeListeningScore) { this.activeListeningScore = activeListeningScore; }
    
    public Integer getObjectionHandlingScore() { return objectionHandlingScore; }
    public void setObjectionHandlingScore(Integer objectionHandlingScore) { this.objectionHandlingScore = objectionHandlingScore; }
    
    public Integer getClosingRhythmScore() { return closingRhythmScore; }
    public void setClosingRhythmScore(Integer closingRhythmScore) { this.closingRhythmScore = closingRhythmScore; }
    
    public Integer getEmpathyScore() { return empathyScore; }
    public void setEmpathyScore(Integer empathyScore) { this.empathyScore = empathyScore; }
    
    public Integer getExplicitObjections() { return explicitObjections; }
    public void setExplicitObjections(Integer explicitObjections) { this.explicitObjections = explicitObjections; }
    
    public Integer getImplicitObjections() { return implicitObjections; }
    public void setImplicitObjections(Integer implicitObjections) { this.implicitObjections = implicitObjections; }
    
    public Integer getUnansweredObjections() { return unansweredObjections; }
    public void setUnansweredObjections(Integer unansweredObjections) { this.unansweredObjections = unansweredObjections; }
    
    public Integer getIneffectiveResponses() { return ineffectiveResponses; }
    public void setIneffectiveResponses(Integer ineffectiveResponses) { this.ineffectiveResponses = ineffectiveResponses; }
    
    public String getKeyAbandonPhrase() { return keyAbandonPhrase; }
    public void setKeyAbandonPhrase(String keyAbandonPhrase) { this.keyAbandonPhrase = keyAbandonPhrase; }
    
    public Integer getAbandonMinute() { return abandonMinute; }
    public void setAbandonMinute(Integer abandonMinute) { this.abandonMinute = abandonMinute; }
    
    public LocalDateTime getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(LocalDateTime analyzedAt) { this.analyzedAt = analyzedAt; }
    
    public String getRawAnalysisJson() { return rawAnalysisJson; }
    public void setRawAnalysisJson(String rawAnalysisJson) { this.rawAnalysisJson = rawAnalysisJson; }
}
