package com.example.report.model;

import java.util.List;
import java.util.Map;

public class EmployeeReportRequest {
    // 1. Datos generales
    private String nombre;
    private String posicion;
    private String fechaIngreso;
    private String evaluador;
    private String definicionObjetivos;
    private String midYearReview;
    private String finalReviewDate;

    // 2. Objetivos SMART (lista de objetivos)
    private List<ObjetivoSmart> objetivos;

    // 3. Progreso - Mid Year Review
    private List<ProgresoObjetivo> midYearProgreso;
    private int resultadoParcialSmart;

    // 4. Progreso - Final Review
    private List<ProgresoObjetivo> finalProgreso;
    private int resultadoFinalSmart;

    // 5. Core Values (escala 1-5)
    private int resolvemosEficientemente;
    private int somosTransparentes;
    private int nosDesafiamos;
    private int confiamosEnElOtro;
    private int resultadoCoreValues;

    // 6. Áreas de mejora
    private String areasMejora;
    private String planAccion1;
    private String planAccion2;
    private String planAccion3;

    // 7. Feedback del colaborador
    private String feedbackDesempeno;
    private String feedbackApoyo;

    // 8. Seguimiento
    private String fechaBonoProporcional;
    private String fechaBonoFinal;

    // Getters and setters
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    
    public String getPosicion() { return posicion; }
    public void setPosicion(String posicion) { this.posicion = posicion; }
    
    public String getFechaIngreso() { return fechaIngreso; }
    public void setFechaIngreso(String fechaIngreso) { this.fechaIngreso = fechaIngreso; }
    
    public String getEvaluador() { return evaluador; }
    public void setEvaluador(String evaluador) { this.evaluador = evaluador; }
    
    public String getDefinicionObjetivos() { return definicionObjetivos; }
    public void setDefinicionObjetivos(String definicionObjetivos) { this.definicionObjetivos = definicionObjetivos; }
    
    public String getMidYearReview() { return midYearReview; }
    public void setMidYearReview(String midYearReview) { this.midYearReview = midYearReview; }
    
    public String getFinalReviewDate() { return finalReviewDate; }
    public void setFinalReviewDate(String finalReviewDate) { this.finalReviewDate = finalReviewDate; }
    
    public List<ObjetivoSmart> getObjetivos() { return objetivos; }
    public void setObjetivos(List<ObjetivoSmart> objetivos) { this.objetivos = objetivos; }
    
    public List<ProgresoObjetivo> getMidYearProgreso() { return midYearProgreso; }
    public void setMidYearProgreso(List<ProgresoObjetivo> midYearProgreso) { this.midYearProgreso = midYearProgreso; }
    
    public int getResultadoParcialSmart() { return resultadoParcialSmart; }
    public void setResultadoParcialSmart(int resultadoParcialSmart) { this.resultadoParcialSmart = resultadoParcialSmart; }
    
    public List<ProgresoObjetivo> getFinalProgreso() { return finalProgreso; }
    public void setFinalProgreso(List<ProgresoObjetivo> finalProgreso) { this.finalProgreso = finalProgreso; }
    
    public int getResultadoFinalSmart() { return resultadoFinalSmart; }
    public void setResultadoFinalSmart(int resultadoFinalSmart) { this.resultadoFinalSmart = resultadoFinalSmart; }
    
    public int getResolvemosEficientemente() { return resolvemosEficientemente; }
    public void setResolvemosEficientemente(int resolvemosEficientemente) { this.resolvemosEficientemente = resolvemosEficientemente; }
    
    public int getSomosTransparentes() { return somosTransparentes; }
    public void setSomosTransparentes(int somosTransparentes) { this.somosTransparentes = somosTransparentes; }
    
    public int getNosDesafiamos() { return nosDesafiamos; }
    public void setNosDesafiamos(int nosDesafiamos) { this.nosDesafiamos = nosDesafiamos; }
    
    public int getConfiamosEnElOtro() { return confiamosEnElOtro; }
    public void setConfiamosEnElOtro(int confiamosEnElOtro) { this.confiamosEnElOtro = confiamosEnElOtro; }
    
    public int getResultadoCoreValues() { return resultadoCoreValues; }
    public void setResultadoCoreValues(int resultadoCoreValues) { this.resultadoCoreValues = resultadoCoreValues; }
    
    public String getAreasMejora() { return areasMejora; }
    public void setAreasMejora(String areasMejora) { this.areasMejora = areasMejora; }
    
    public String getPlanAccion1() { return planAccion1; }
    public void setPlanAccion1(String planAccion1) { this.planAccion1 = planAccion1; }
    
    public String getPlanAccion2() { return planAccion2; }
    public void setPlanAccion2(String planAccion2) { this.planAccion2 = planAccion2; }
    
    public String getPlanAccion3() { return planAccion3; }
    public void setPlanAccion3(String planAccion3) { this.planAccion3 = planAccion3; }
    
    public String getFeedbackDesempeno() { return feedbackDesempeno; }
    public void setFeedbackDesempeno(String feedbackDesempeno) { this.feedbackDesempeno = feedbackDesempeno; }
    
    public String getFeedbackApoyo() { return feedbackApoyo; }
    public void setFeedbackApoyo(String feedbackApoyo) { this.feedbackApoyo = feedbackApoyo; }
    
    public String getFechaBonoProporcional() { return fechaBonoProporcional; }
    public void setFechaBonoProporcional(String fechaBonoProporcional) { this.fechaBonoProporcional = fechaBonoProporcional; }
    
    public String getFechaBonoFinal() { return fechaBonoFinal; }
    public void setFechaBonoFinal(String fechaBonoFinal) { this.fechaBonoFinal = fechaBonoFinal; }

    // Clases internas
    public static class ObjetivoSmart {
        private int numero;
        private String titulo;
        private String descripcion;
        private int ponderacion;

        public int getNumero() { return numero; }
        public void setNumero(int numero) { this.numero = numero; }
        public String getTitulo() { return titulo; }
        public void setTitulo(String titulo) { this.titulo = titulo; }
        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
        public int getPonderacion() { return ponderacion; }
        public void setPonderacion(int ponderacion) { this.ponderacion = ponderacion; }
    }

    public static class ProgresoObjetivo {
        private int objetivoNumero;
        private String estado; // Cumplido, En proceso, No cumplido
        private int porcentajeCumplimiento;
        private String comentarios;

        public int getObjetivoNumero() { return objetivoNumero; }
        public void setObjetivoNumero(int objetivoNumero) { this.objetivoNumero = objetivoNumero; }
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
        public int getPorcentajeCumplimiento() { return porcentajeCumplimiento; }
        public void setPorcentajeCumplimiento(int porcentajeCumplimiento) { this.porcentajeCumplimiento = porcentajeCumplimiento; }
        public String getComentarios() { return comentarios; }
        public void setComentarios(String comentarios) { this.comentarios = comentarios; }
    }
}
