package com.example.report.service;

import com.example.report.model.EmployeeReportRequest;
import com.example.report.model.EmployeeReportRequest.ObjetivoSmart;
import com.example.report.model.EmployeeReportRequest.ProgresoObjetivo;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ReportService {

    public byte[] generatePdf(EmployeeReportRequest req) throws Exception {
        // Load template
        ClassPathResource r = new ClassPathResource("templates/report.html");
        String html;
        try (InputStream in = r.getInputStream()) {
            html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        // Replace placeholders - Datos generales
        html = html.replace("{{nombre}}", safe(req.getNombre()))
                .replace("{{posicion}}", safe(req.getPosicion()))
                .replace("{{fechaIngreso}}", safe(req.getFechaIngreso()))
                .replace("{{evaluador}}", safe(req.getEvaluador()))
                .replace("{{definicionObjetivos}}", safe(req.getDefinicionObjetivos()))
                .replace("{{midYearReview}}", safe(req.getMidYearReview()))
                .replace("{{finalReviewDate}}", safe(req.getFinalReviewDate()));

        // Objetivos SMART
        html = html.replace("{{objetivos}}", buildObjetivosHtml(req.getObjetivos()));

        // Progreso Mid Year
        html = html.replace("{{midYearProgreso}}", buildProgresoHtml(req.getMidYearProgreso()))
                .replace("{{resultadoParcialSmart}}", String.valueOf(req.getResultadoParcialSmart()));

        // Progreso Final
        html = html.replace("{{finalProgreso}}", buildProgresoHtml(req.getFinalProgreso()))
                .replace("{{resultadoFinalSmart}}", String.valueOf(req.getResultadoFinalSmart()));

        // Core Values
        html = html.replace("{{resolvemosEficientemente}}", buildCoreValueRow(req.getResolvemosEficientemente()))
                .replace("{{somosTransparentes}}", buildCoreValueRow(req.getSomosTransparentes()))
                .replace("{{nosDesafiamos}}", buildCoreValueRow(req.getNosDesafiamos()))
                .replace("{{confiamosEnElOtro}}", buildCoreValueRow(req.getConfiamosEnElOtro()))
                .replace("{{resultadoCoreValues}}", String.valueOf(req.getResultadoCoreValues()));

        // Áreas de mejora
        html = html.replace("{{areasMejora}}", safe(req.getAreasMejora()))
                .replace("{{planAccion1}}", safe(req.getPlanAccion1()))
                .replace("{{planAccion2}}", safe(req.getPlanAccion2()))
                .replace("{{planAccion3}}", safe(req.getPlanAccion3()));

        // Feedback
        html = html.replace("{{feedbackDesempeno}}", safe(req.getFeedbackDesempeno()))
                .replace("{{feedbackApoyo}}", safe(req.getFeedbackApoyo()));

        // Seguimiento
        html = html.replace("{{fechaBonoProporcional}}", safe(req.getFechaBonoProporcional()))
                .replace("{{fechaBonoFinal}}", safe(req.getFechaBonoFinal()));

        // Render PDF
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        }
    }

    private String buildObjetivosHtml(List<ObjetivoSmart> objetivos) {
        if (objetivos == null || objetivos.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (ObjetivoSmart obj : objetivos) {
            sb.append("<div class=\"objetivo\">")
              .append("<div class=\"objetivo-header\">")
              .append("<span class=\"objetivo-num\">").append(obj.getNumero()).append(".</span> ")
              .append("<span class=\"objetivo-titulo\">").append(escape(obj.getTitulo())).append("</span>")
              .append("<span class=\"ponderacion\">Ponderación: ").append(obj.getPonderacion()).append("%</span>")
              .append("</div>")
              .append("<p class=\"objetivo-desc\">").append(escape(obj.getDescripcion())).append("</p>")
              .append("</div>");
        }
        return sb.toString();
    }

    private String buildProgresoHtml(List<ProgresoObjetivo> progreso) {
        if (progreso == null || progreso.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (ProgresoObjetivo p : progreso) {
            String estadoClass = "estado-proceso";
            if ("Cumplido".equalsIgnoreCase(p.getEstado())) {
                estadoClass = "estado-cumplido";
            } else if ("No cumplido".equalsIgnoreCase(p.getEstado())) {
                estadoClass = "estado-nocumplido";
            }
            sb.append("<div class=\"progreso-item\">")
              .append("<div class=\"progreso-header\">")
              .append("<span>Objetivo ").append(p.getObjetivoNumero()).append(": </span>")
              .append("<span class=\"estado ").append(estadoClass).append("\">").append(escape(p.getEstado())).append("</span>")
              .append("</div>")
              .append("<div class=\"progreso-detalle\">")
              .append("<span>Porcentaje de cumplimiento: ").append(p.getPorcentajeCumplimiento()).append("%</span>")
              .append("</div>")
              .append("<div class=\"progreso-comentarios\">")
              .append("<span>Comentarios: ").append(escape(p.getComentarios())).append("</span>")
              .append("</div>")
              .append("</div>");
        }
        return sb.toString();
    }

    private String buildCoreValueRow(int value) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            if (i == value) {
                sb.append("<td class=\"cv-selected\">X</td>");
            } else {
                sb.append("<td></td>");
            }
        }
        return sb.toString();
    }

    private String safe(String s) {
        return s == null ? "" : escape(s);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
