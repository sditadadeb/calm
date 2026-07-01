package com.calm.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.calm.admin.dto.ExtraDataFieldDTO;
import com.calm.admin.dto.ExtraDataFieldOptionDTO;
import com.calm.admin.dto.ExtraDataSchemaDTO;
import com.calm.admin.dto.TranscriptionDTO;
import com.calm.admin.model.SystemConfig;
import com.calm.admin.repository.SystemConfigRepository;
import com.calm.admin.repository.TranscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ExtraDataSchemaProvider {

    private static final Logger log = LoggerFactory.getLogger(ExtraDataSchemaProvider.class);
    public static final String SCHEMA_KEY_PREFIX = "extra_data_schema:branch:";

    private static final Set<String> VALID_TYPES = Set.of(
            "text", "textarea", "email", "number", "currency", "date", "time", "checkbox", "select"
    );
    private static final Set<String> VALID_SYSTEM_KEYS = Set.of(
            "saleCompleted", "noSaleReason"
    );

    private final SystemConfigRepository configRepository;
    private final TranscriptionRepository transcriptionRepository;
    private final ObjectMapper objectMapper;

    public ExtraDataSchemaProvider(SystemConfigRepository configRepository,
                                   TranscriptionRepository transcriptionRepository,
                                   ObjectMapper objectMapper) {
        this.configRepository = configRepository;
        this.transcriptionRepository = transcriptionRepository;
        this.objectMapper = objectMapper;
    }

    public ExtraDataSchemaDTO getSchema(Long branchId, String branchName) {
        validateBranchRef(branchName);
        ExtraDataSchemaDTO schema = configRepository.findByConfigKey(schemaKey(branchId, branchName))
                .map(SystemConfig::getConfigValue)
                .filter(v -> v != null && !v.isBlank())
                .map(this::parseSchema)
                .orElse(new ExtraDataSchemaDTO(new ArrayList<>()));
        schema.setBranchId(branchId);
        schema.setBranchName(branchName);
        return schema;
    }

    public void saveSchema(Long branchId, String branchName, ExtraDataSchemaDTO schema) {
        validateBranchRef(branchName);
        if (!transcriptionRepository.existsBranchPair(branchId, branchName)) {
            throw new IllegalArgumentException("Sucursal no encontrada en las transcripciones");
        }
        validateSchema(schema);
        String json = serializeSchema(schema);
        String key = schemaKey(branchId, branchName);
        SystemConfig config = configRepository.findByConfigKey(key)
                .orElse(new SystemConfig(key, "", "Extra data schema for branch"));
        config.setConfigValue(json);
        configRepository.save(config);
    }

    public void resetToTemplate(Long branchId, String branchName) {
        saveSchema(branchId, branchName, buildSpreadsheetTemplate());
    }

    public List<ExtraDataFieldDTO> getSortedFields(Long branchId, String branchName) {
        if (branchName == null || branchName.isBlank()) {
            return List.of();
        }
        return getSchema(branchId, branchName).getFields().stream()
                .sorted(Comparator.comparingInt(ExtraDataFieldDTO::getOrder))
                .collect(Collectors.toList());
    }

    public List<ExtraDataFieldDTO> getSortedFieldsForExport(List<TranscriptionDTO> rows, Long filterBranchId) {
        if (filterBranchId != null) {
            String name = rows.stream()
                    .filter(r -> filterBranchId.equals(r.getBranchId()))
                    .map(TranscriptionDTO::getBranchName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            if (name != null) {
                return getSortedFields(filterBranchId, name);
            }
        }
        LinkedHashMap<String, ExtraDataFieldDTO> merged = new LinkedHashMap<>();
        for (TranscriptionDTO row : rows) {
            for (ExtraDataFieldDTO field : getSortedFields(row.getBranchId(), row.getBranchName())) {
                merged.putIfAbsent(field.getId(), field);
            }
        }
        return merged.values().stream()
                .sorted(Comparator.comparingInt(ExtraDataFieldDTO::getOrder))
                .collect(Collectors.toList());
    }

    public String schemaKey(Long branchId, String branchName) {
        validateBranchRef(branchName);
        String slug = slugifyBranchName(branchName);
        if (branchId != null) {
            return SCHEMA_KEY_PREFIX + branchId + ":" + slug;
        }
        return SCHEMA_KEY_PREFIX + "noid:" + slug;
    }

    private void validateBranchRef(String branchName) {
        if (branchName == null || branchName.isBlank()) {
            throw new IllegalArgumentException("branchName es obligatorio");
        }
    }

    static String slugifyBranchName(String branchName) {
        String normalized = Normalizer.normalize(branchName.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_|_$", "");
        return normalized.isBlank() ? "sin_nombre" : normalized;
    }

    private ExtraDataSchemaDTO parseSchema(String json) {
        try {
            ExtraDataSchemaDTO dto = objectMapper.readValue(json, ExtraDataSchemaDTO.class);
            if (dto.getFields() == null) {
                dto.setFields(new ArrayList<>());
            }
            return dto;
        } catch (JsonProcessingException e) {
            log.warn("Invalid extra data schema JSON, returning empty schema");
            return new ExtraDataSchemaDTO(new ArrayList<>());
        }
    }

    private String serializeSchema(ExtraDataSchemaDTO schema) {
        try {
            return objectMapper.writeValueAsString(schema);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("No se pudo serializar el schema");
        }
    }

    private void validateSchema(ExtraDataSchemaDTO schema) {
        if (schema == null || schema.getFields() == null) {
            throw new IllegalArgumentException("Schema inválido");
        }
        Set<String> ids = new HashSet<>();
        for (ExtraDataFieldDTO field : schema.getFields()) {
            if (field.getId() == null || field.getId().isBlank()) {
                throw new IllegalArgumentException("Cada campo debe tener un id");
            }
            if (!ids.add(field.getId())) {
                throw new IllegalArgumentException("Id duplicado: " + field.getId());
            }
            if (field.getLabel() == null || field.getLabel().isBlank()) {
                throw new IllegalArgumentException("Cada campo debe tener un label");
            }
            if (field.getType() == null || !VALID_TYPES.contains(field.getType())) {
                throw new IllegalArgumentException("Tipo inválido en campo: " + field.getId());
            }
            if (field.getSystemKey() != null && !field.getSystemKey().isBlank()
                    && !VALID_SYSTEM_KEYS.contains(field.getSystemKey())) {
                throw new IllegalArgumentException("systemKey inválido en campo: " + field.getId());
            }
            if ("select".equals(field.getType()) && (field.getOptions() == null || field.getOptions().isEmpty())) {
                throw new IllegalArgumentException("El campo select debe tener opciones: " + field.getId());
            }
        }
    }

    private ExtraDataSchemaDTO buildSpreadsheetTemplate() {
        List<ExtraDataFieldDTO> fields = new ArrayList<>();

        fields.add(field("dia_semana", "Día", "text", 1, false, null));
        fields.add(field("fecha", "Fecha", "date", 2, false, null));
        fields.add(field("hora", "Hora", "time", 3, false, null));
        fields.add(field("mail", "MAIL", "email", 4, false, null));

        ExtraDataFieldDTO accion = field("accion", "Acción", "select", 5, false, null);
        accion.setOptions(List.of(
                opt("nada", "Nada", "#E8D5F5"),
                opt("compra", "Compra", "#C8E6C9"),
                opt("fallido", "Fallido", "#FF5252"),
                opt("falta_stock", "Falta stock", "#90CAF9"),
                opt("soporte", "Soporte", "#8D6E63"),
                opt("visita_rapida", "Visita rápida", "#FFE082"),
                opt("retiro_accion", "Retiro", "#FFCC80")
        ));
        fields.add(accion);

        fields.add(field("n_orden", "N° Orden", "number", 6, false, null));
        fields.add(field("skus", "Skus", "text", 7, false, null));
        fields.add(field("total", "Total", "currency", 8, false, null));
        fields.add(field("retiro", "¿Retiró?", "checkbox", 9, false, null));

        ExtraDataFieldDTO bolsa = field("bolsa", "Bolsa", "select", 10, false, null);
        bolsa.setOptions(List.of(opt("1", "1", "#FFE082"), opt("2", "2", "#FFE082"), opt("0", "0", null)));
        fields.add(bolsa);

        fields.add(field("vino_auto", "Vino en auto?", "checkbox", 11, false, null));

        ExtraDataFieldDTO kit = field("kit_regalo", "Kit de regalo", "select", 12, false, null);
        kit.setOptions(List.of(opt("si", "Sí", null), opt("no", "No", null)));
        fields.add(kit);

        fields.add(field("nps_qr", "NPS (QR)", "checkbox", 13, false, null));

        ExtraDataFieldDTO como = field("como_nos_conocio", "Como nos conoció?", "select", 14, false, null);
        como.setOptions(List.of(
                opt("redes", "Redes sociales", null),
                opt("recomendacion", "Recomendación", null),
                opt("publicidad", "Publicidad", null),
                opt("otro", "Otro", null)
        ));
        fields.add(como);

        ExtraDataFieldDTO marcas = field("consulto_otras_marcas", "Consultó otras marcas antes de llegar?", "select", 15, false, null);
        marcas.setOptions(List.of(opt("si", "Sí", null), opt("no", "No", null)));
        fields.add(marcas);

        fields.add(field("observaciones", "Observaciones / Info Adicional", "textarea", 16, false, null));

        fields.add(field("gestion_completada", "Gestión completada", "checkbox", 17, false, "saleCompleted"));
        fields.add(field("motivo_no_resolucion", "Motivo de no resolución", "textarea", 18, false, "noSaleReason"));

        return new ExtraDataSchemaDTO(fields);
    }

    private static ExtraDataFieldDTO field(String id, String label, String type, int order, boolean required, String systemKey) {
        ExtraDataFieldDTO f = new ExtraDataFieldDTO();
        f.setId(id);
        f.setLabel(label);
        f.setType(type);
        f.setOrder(order);
        f.setRequired(required);
        f.setSystemKey(systemKey);
        return f;
    }

    private static ExtraDataFieldOptionDTO opt(String value, String label, String color) {
        return new ExtraDataFieldOptionDTO(value, label, color);
    }
}
