package com.bancooccidente.admin.model;

import java.util.List;

public class AnalysisResult {
    
    private boolean saleCompleted;
    private String saleStatus; // SALE_CONFIRMED, SALE_LIKELY, ADVANCE_NO_CLOSE, NO_SALE, UNINTERPRETABLE
    private int analysisConfidence; // 0-100
    private String confidenceTrace; // JSON con trazabilidad del cálculo
    private String saleEvidence; // Evidencia que confirma/descarta la venta
    private String saleEvidenceMeta; // JSON con metadata de evidencia de venta
    private String noSaleReason;
    private List<String> productsDiscussed;
    private List<String> customerObjections;
    private List<String> improvementSuggestions;
    private String executiveSummary;
    private int sellerScore;
    private List<String> sellerStrengths;
    private List<String> sellerWeaknesses;
    private String followUpRecommendation;

    // === Métricas Banco de Occidente ===
    private String motivoVisita;
    private String estadoEmocional;
    private int csatScore;
    private int escuchaActivaScore;
    private boolean cumplimientoProtocolo;
    private int protocoloScore;
    // JSON con score y evidencia por cada uno de los 6 pasos del protocolo BO
    private String protocoloDetalle;
    private boolean productoOfrecido;
    private Long montoOfrecido;
    private Boolean cumplimientoLineamiento;
    private boolean grabacionCortadaCliente;
    private boolean grabacionCortadaManual;

    public AnalysisResult() {}

    public boolean isSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(boolean saleCompleted) { this.saleCompleted = saleCompleted; }

    public String getSaleStatus() { return saleStatus; }
    public void setSaleStatus(String saleStatus) { this.saleStatus = saleStatus; }

    public int getAnalysisConfidence() { return analysisConfidence; }
    public void setAnalysisConfidence(int analysisConfidence) { this.analysisConfidence = analysisConfidence; }

    public String getConfidenceTrace() { return confidenceTrace; }
    public void setConfidenceTrace(String confidenceTrace) { this.confidenceTrace = confidenceTrace; }

    public String getSaleEvidence() { return saleEvidence; }
    public void setSaleEvidence(String saleEvidence) { this.saleEvidence = saleEvidence; }

    public String getSaleEvidenceMeta() { return saleEvidenceMeta; }
    public void setSaleEvidenceMeta(String saleEvidenceMeta) { this.saleEvidenceMeta = saleEvidenceMeta; }

    public String getNoSaleReason() { return noSaleReason; }
    public void setNoSaleReason(String noSaleReason) { this.noSaleReason = noSaleReason; }

    public List<String> getProductsDiscussed() { return productsDiscussed; }
    public void setProductsDiscussed(List<String> productsDiscussed) { this.productsDiscussed = productsDiscussed; }

    public List<String> getCustomerObjections() { return customerObjections; }
    public void setCustomerObjections(List<String> customerObjections) { this.customerObjections = customerObjections; }

    public List<String> getImprovementSuggestions() { return improvementSuggestions; }
    public void setImprovementSuggestions(List<String> improvementSuggestions) { this.improvementSuggestions = improvementSuggestions; }

    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }

    public int getSellerScore() { return sellerScore; }
    public void setSellerScore(int sellerScore) { this.sellerScore = sellerScore; }

    public List<String> getSellerStrengths() { return sellerStrengths; }
    public void setSellerStrengths(List<String> sellerStrengths) { this.sellerStrengths = sellerStrengths; }

    public List<String> getSellerWeaknesses() { return sellerWeaknesses; }
    public void setSellerWeaknesses(List<String> sellerWeaknesses) { this.sellerWeaknesses = sellerWeaknesses; }

    public String getFollowUpRecommendation() { return followUpRecommendation; }
    public void setFollowUpRecommendation(String followUpRecommendation) { this.followUpRecommendation = followUpRecommendation; }

    public String getMotivoVisita() { return motivoVisita; }
    public void setMotivoVisita(String motivoVisita) { this.motivoVisita = motivoVisita; }

    public String getEstadoEmocional() { return estadoEmocional; }
    public void setEstadoEmocional(String estadoEmocional) { this.estadoEmocional = estadoEmocional; }

    public int getCsatScore() { return csatScore; }
    public void setCsatScore(int csatScore) { this.csatScore = csatScore; }

    public int getEscuchaActivaScore() { return escuchaActivaScore; }
    public void setEscuchaActivaScore(int escuchaActivaScore) { this.escuchaActivaScore = escuchaActivaScore; }

    public boolean isCumplimientoProtocolo() { return cumplimientoProtocolo; }
    public void setCumplimientoProtocolo(boolean cumplimientoProtocolo) { this.cumplimientoProtocolo = cumplimientoProtocolo; }

    public int getProtocoloScore() { return protocoloScore; }
    public void setProtocoloScore(int protocoloScore) { this.protocoloScore = protocoloScore; }

    public String getProtocoloDetalle() { return protocoloDetalle; }
    public void setProtocoloDetalle(String protocoloDetalle) { this.protocoloDetalle = protocoloDetalle; }

    public boolean isProductoOfrecido() { return productoOfrecido; }
    public void setProductoOfrecido(boolean productoOfrecido) { this.productoOfrecido = productoOfrecido; }

    public Long getMontoOfrecido() { return montoOfrecido; }
    public void setMontoOfrecido(Long montoOfrecido) { this.montoOfrecido = montoOfrecido; }

    public Boolean getCumplimientoLineamiento() { return cumplimientoLineamiento; }
    public void setCumplimientoLineamiento(Boolean cumplimientoLineamiento) { this.cumplimientoLineamiento = cumplimientoLineamiento; }

    public boolean isGrabacionCortadaCliente() { return grabacionCortadaCliente; }
    public void setGrabacionCortadaCliente(boolean grabacionCortadaCliente) { this.grabacionCortadaCliente = grabacionCortadaCliente; }

    public boolean isGrabacionCortadaManual() { return grabacionCortadaManual; }
    public void setGrabacionCortadaManual(boolean grabacionCortadaManual) { this.grabacionCortadaManual = grabacionCortadaManual; }
}
