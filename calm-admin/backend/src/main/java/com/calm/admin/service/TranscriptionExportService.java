package com.calm.admin.service;

import com.calm.admin.dto.ExtraDataFieldDTO;
import com.calm.admin.dto.ExtraDataFieldOptionDTO;
import com.calm.admin.dto.TranscriptionDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class TranscriptionExportService {

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ExtraDataSchemaProvider schemaProvider;

    public TranscriptionExportService(ExtraDataSchemaProvider schemaProvider) {
        this.schemaProvider = schemaProvider;
    }

    public byte[] exportCsv(List<TranscriptionDTO> rows, Long filterBranchId) {
        List<ExtraDataFieldDTO> schemaFields = schemaProvider.getSortedFieldsForExport(rows, filterBranchId);
        List<String> headers = buildHeaders(schemaFields);
        StringBuilder sb = new StringBuilder();
        sb.append('﻿');
        sb.append(String.join(";", headers)).append('\n');

        for (TranscriptionDTO row : rows) {
            List<String> values = buildRowValues(row, schemaFields, filterBranchId);
            sb.append(values.stream().map(this::escapeCsv).collect(Collectors.joining(";"))).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportXlsx(List<TranscriptionDTO> rows, Long filterBranchId) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            writeSheet(workbook, "Transcripciones", rows, filterBranchId);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportCsvZipByBranch(List<TranscriptionDTO> rows) throws IOException {
        LinkedHashMap<BranchGroup, List<TranscriptionDTO>> groups = groupByBranch(rows);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (Map.Entry<BranchGroup, List<TranscriptionDTO>> entry : groups.entrySet()) {
                BranchGroup branch = entry.getKey();
                byte[] csv = exportCsv(entry.getValue(), branch.branchId());
                String filename = branch.fileSlug() + ".csv";
                ZipEntry zipEntry = new ZipEntry(filename);
                zos.putNextEntry(zipEntry);
                zos.write(csv);
                zos.closeEntry();
            }
            zos.finish();
            return baos.toByteArray();
        }
    }

    public byte[] exportXlsxByBranch(List<TranscriptionDTO> rows) throws IOException {
        LinkedHashMap<BranchGroup, List<TranscriptionDTO>> groups = groupByBranch(rows);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Set<String> usedSheetNames = new HashSet<>();
            for (Map.Entry<BranchGroup, List<TranscriptionDTO>> entry : groups.entrySet()) {
                String sheetName = uniqueSheetName(entry.getKey().sheetName(), usedSheetNames);
                writeSheet(workbook, sheetName, entry.getValue(), entry.getKey().branchId());
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void writeSheet(Workbook workbook, String sheetName, List<TranscriptionDTO> rows, Long filterBranchId) {
        List<ExtraDataFieldDTO> schemaFields = schemaProvider.getSortedFieldsForExport(rows, filterBranchId);
        List<String> headers = buildHeaders(schemaFields);
        Sheet sheet = workbook.createSheet(sheetName);

        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (TranscriptionDTO dto : rows) {
            Row row = sheet.createRow(rowIdx++);
            List<String> values = buildRowValues(dto, schemaFields, filterBranchId);
            for (int col = 0; col < values.size(); col++) {
                Cell cell = row.createCell(col);
                String val = values.get(col);
                cell.setCellValue(val);

                if (col >= 7) {
                    int schemaCol = col - 7;
                    if (schemaCol < schemaFields.size()) {
                        applySelectColor(workbook, cell, schemaFields.get(schemaCol), dto, val);
                    }
                }
            }
        }

        for (int i = 0; i < headers.size(); i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private LinkedHashMap<BranchGroup, List<TranscriptionDTO>> groupByBranch(List<TranscriptionDTO> rows) {
        LinkedHashMap<BranchGroup, List<TranscriptionDTO>> groups = new LinkedHashMap<>();
        for (TranscriptionDTO row : rows) {
            BranchGroup key = BranchGroup.from(row);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }
        return groups;
    }

    private String uniqueSheetName(String base, Set<String> used) {
        String sanitized = sanitizeSheetName(base);
        if (!used.contains(sanitized)) {
            used.add(sanitized);
            return sanitized;
        }
        for (int i = 2; i < 100; i++) {
            String candidate = sanitizeSheetName(base + " " + i);
            if (!used.contains(candidate)) {
                used.add(candidate);
                return candidate;
            }
        }
        String fallback = sanitizeSheetName("Sucursal " + used.size());
        used.add(fallback);
        return fallback;
    }

    private String sanitizeSheetName(String name) {
        String s = name != null ? name : "Sin sucursal";
        s = s.replaceAll("[\\\\/?*\\[\\]:]", " ").trim();
        if (s.isBlank()) s = "Sin sucursal";
        return s.length() > 31 ? s.substring(0, 31) : s;
    }

    private record BranchGroup(Long branchId, String branchName) {
        static BranchGroup from(TranscriptionDTO row) {
            return new BranchGroup(row.getBranchId(), row.getBranchName() != null ? row.getBranchName() : "Sin sucursal");
        }

        String fileSlug() {
            return ExtraDataSchemaProvider.slugifyBranchName(branchName);
        }

        String sheetName() {
            return branchName;
        }
    }

    private void applySelectColor(Workbook workbook, Cell cell, ExtraDataFieldDTO field,
                                  TranscriptionDTO dto, String displayValue) {
        if (!"select".equals(field.getType()) || field.getOptions() == null) {
            return;
        }
        String raw = getExtraFieldRawString(dto, field);
        for (ExtraDataFieldOptionDTO opt : field.getOptions()) {
            if (opt.getValue() != null && opt.getValue().equals(raw) && opt.getColor() != null) {
                CellStyle style = workbook.createCellStyle();
                style.cloneStyleFrom(cell.getCellStyle());
                style.setFillForegroundColor(hexToIndexed(opt.getColor()));
                style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                cell.setCellStyle(style);
                cell.setCellValue(displayValue);
                break;
            }
        }
    }

    private short hexToIndexed(String hex) {
        if (hex == null) return IndexedColors.WHITE.getIndex();
        String h = hex.replace("#", "");
        if (h.length() != 6) return IndexedColors.WHITE.getIndex();
        try {
            int r = Integer.parseInt(h.substring(0, 2), 16);
            int g = Integer.parseInt(h.substring(2, 4), 16);
            int b = Integer.parseInt(h.substring(4, 6), 16);
            if (r > 200 && g > 200) return IndexedColors.LIGHT_GREEN.getIndex();
            if (r > 200 && g > 150) return IndexedColors.LIGHT_YELLOW.getIndex();
            if (r > 200) return IndexedColors.ROSE.getIndex();
            if (b > 200) return IndexedColors.LIGHT_BLUE.getIndex();
            if (g > 200) return IndexedColors.LIGHT_GREEN.getIndex();
            return IndexedColors.GREY_25_PERCENT.getIndex();
        } catch (NumberFormatException e) {
            return IndexedColors.WHITE.getIndex();
        }
    }

    private List<String> buildHeaders(List<ExtraDataFieldDTO> schemaFields) {
        List<String> headers = new ArrayList<>(List.of(
                "ID", "Agente", "Sucursal", "Fecha", "Analizado", "Puntuación", "Resultado"
        ));
        for (ExtraDataFieldDTO field : schemaFields) {
            headers.add(field.getLabel());
        }
        return headers;
    }

    private List<String> buildRowValues(TranscriptionDTO dto, List<ExtraDataFieldDTO> exportColumns, Long filterBranchId) {
        List<String> values = new ArrayList<>();
        values.add(nullSafe(dto.getRecordingId()));
        values.add(nullSafe(dto.getUserName()));
        values.add(nullSafe(dto.getBranchName()));
        values.add(formatDateTime(dto.getRecordingDate()));
        values.add(Boolean.TRUE.equals(dto.getAnalyzed()) ? "Sí" : "No");
        values.add(dto.getSellerScore() != null ? String.valueOf(dto.getSellerScore()) : "");
        values.add(nullSafe(dto.getSaleStatus()));

        Set<String> rowFieldIds = schemaProvider.getSortedFields(dto.getBranchId(), dto.getBranchName()).stream()
                .map(ExtraDataFieldDTO::getId)
                .collect(Collectors.toSet());
        for (ExtraDataFieldDTO field : exportColumns) {
            if (filterBranchId != null || rowFieldIds.contains(field.getId())) {
                values.add(formatExtraValue(field, dto));
            } else {
                values.add("");
            }
        }
        return values;
    }

    private String formatExtraValue(ExtraDataFieldDTO field, TranscriptionDTO dto) {
        Object raw = getExtraFieldRaw(dto, field);
        if (raw == null) return "";

        return switch (field.getType()) {
            case "checkbox" -> toBoolean(raw) ? "Sí" : "No";
            case "select" -> field.getOptions().stream()
                    .filter(o -> o.getValue() != null && o.getValue().equals(String.valueOf(raw)))
                    .map(ExtraDataFieldOptionDTO::getLabel)
                    .findFirst()
                    .orElse(String.valueOf(raw));
            case "currency" -> formatCurrency(raw);
            case "date", "time" -> String.valueOf(raw);
            default -> String.valueOf(raw);
        };
    }

    private Object getExtraFieldRaw(TranscriptionDTO dto, ExtraDataFieldDTO field) {
        Map<String, Object> extra = dto.getExtraData();
        if (extra != null && extra.containsKey(field.getId())) {
            return extra.get(field.getId());
        }
        if (field.getSystemKey() != null) {
            return switch (field.getSystemKey()) {
                case "saleCompleted" -> dto.getSaleCompleted();
                case "noSaleReason" -> dto.getNoSaleReason();
                default -> null;
            };
        }
        return null;
    }

    private String getExtraFieldRawString(TranscriptionDTO dto, ExtraDataFieldDTO field) {
        Object raw = getExtraFieldRaw(dto, field);
        return raw != null ? String.valueOf(raw) : "";
    }

    private boolean toBoolean(Object value) {
        if (value instanceof Boolean b) return b;
        if (value instanceof String s) {
            return "true".equalsIgnoreCase(s) || "si".equalsIgnoreCase(s) || "sí".equalsIgnoreCase(s) || "1".equals(s);
        }
        if (value instanceof Number n) return n.intValue() != 0;
        return false;
    }

    private String formatCurrency(Object raw) {
        try {
            double n = Double.parseDouble(String.valueOf(raw).replace(",", "."));
            return String.format("$%,.2f", n).replace(",", "X").replace(".", ",").replace("X", ".");
        } catch (NumberFormatException e) {
            return String.valueOf(raw);
        }
    }

    private String formatDateTime(LocalDateTime dt) {
        if (dt == null) return "";
        return dt.format(DATETIME_FMT);
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
