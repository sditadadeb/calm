package com.isl.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.isl.admin.model.AnalysisResult;
import com.isl.admin.model.SystemConfig;
import com.isl.admin.config.PromptDefaults;
import com.isl.admin.repository.SystemConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class ChatGPTAnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(ChatGPTAnalyzerService.class);

    private static final String PROMPT_KEY = "analysis_prompt";
    private static final String MODEL_KEY = "openai_model";
    private static final String TEMPERATURE_KEY = "openai_temperature";
    private static final String MAX_TOKENS_KEY = "openai_max_tokens";

    private static final String DEFAULT_PROMPT = PromptDefaults.DEFAULT_ANALYSIS_PROMPT;
    private static final String DEFAULT_BEDROCK_MODEL = "anthropic.claude-sonnet-4-20250514-v1:0";

    @Value("${aws.bedrock.region:us-east-1}")
    private String bedrockRegion;

    @Value("${aws.bedrock.model:}")
    private String bedrockModel;

    private BedrockRuntimeClient bedrockClient;
    private final ObjectMapper objectMapper;
    private final SystemConfigRepository configRepository;
    private boolean serviceReady = false;

    public ChatGPTAnalyzerService(ObjectMapper objectMapper, SystemConfigRepository configRepository) {
        this.objectMapper = objectMapper;
        this.configRepository = configRepository;
    }

    @PostConstruct
    public void init() {
        try {
            this.bedrockClient = BedrockRuntimeClient.builder()
                    .region(Region.of(bedrockRegion))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            String modelId = getModelId();
            log.info("Bedrock service initialized (default credentials). Region: {}, Model: {}", bedrockRegion, modelId);
            serviceReady = true;
        } catch (Exception e) {
            log.error("Failed to initialize Bedrock client: {}", e.getMessage());
        }
    }

    private String getSystemPrompt() {
        return configRepository.findByConfigKey(PROMPT_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(DEFAULT_PROMPT);
    }

    private String getModelId() {
        String dbModel = configRepository.findByConfigKey(MODEL_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(null);
        if (dbModel != null && dbModel.startsWith("anthropic.")) return dbModel;
        if (bedrockModel != null && !bedrockModel.isBlank()) return bedrockModel;
        return DEFAULT_BEDROCK_MODEL;
    }

    private Double getTemperature() {
        return configRepository.findByConfigKey(TEMPERATURE_KEY)
                .map(c -> Double.parseDouble(c.getConfigValue()))
                .orElse(0.3);
    }

    private Integer getMaxTokens() {
        return configRepository.findByConfigKey(MAX_TOKENS_KEY)
                .map(c -> Integer.parseInt(c.getConfigValue()))
                .orElse(4096);
    }

    public AnalysisResult analyzeTranscription(String transcriptionText, String sellerName, String branchName) {
        if (!serviceReady || bedrockClient == null) {
            log.warn("Bedrock service not initialized, returning mock analysis");
            return createMockAnalysis();
        }

        try {
            String systemPrompt = getSystemPrompt();
            String modelId = getModelId();
            Double temperature = getTemperature();
            Integer maxTokens = getMaxTokens();

            String userPrompt = String.format("""
                Analiza la siguiente transcripción de una atención en la sucursal "%s" por el agente "%s":
                
                TRANSCRIPCIÓN:
                %s
                
                Proporciona un análisis completo en formato JSON.
                """, branchName, sellerName, transcriptionText);

            String requestBody = objectMapper.writeValueAsString(java.util.Map.of(
                    "anthropic_version", "bedrock-2023-05-31",
                    "max_tokens", maxTokens,
                    "temperature", temperature,
                    "system", systemPrompt,
                    "messages", List.of(
                            java.util.Map.of("role", "user", "content", userPrompt)
                    )
            ));

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestBody))
                    .build();

            InvokeModelResponse invokeResponse = bedrockClient.invokeModel(request);
            String responseBody = invokeResponse.body().asUtf8String();

            JsonNode responseJson = objectMapper.readTree(responseBody);
            String content = responseJson.path("content").get(0).path("text").asText();

            log.info("Received analysis response from Bedrock (Claude)");
            return parseAnalysisResponse(content);

        } catch (Exception e) {
            log.error("Error analyzing transcription with Bedrock: {}", e.getMessage());
            return createMockAnalysis();
        }
    }
    
    private AnalysisResult parseAnalysisResponse(String response) {
        try {
            String cleanJson = response;
            if (response.contains("```json")) {
                cleanJson = response.substring(response.indexOf("```json") + 7);
                cleanJson = cleanJson.substring(0, cleanJson.indexOf("```"));
            } else if (response.contains("```")) {
                cleanJson = response.substring(response.indexOf("```") + 3);
                cleanJson = cleanJson.substring(0, cleanJson.indexOf("```"));
            }

            JsonNode root = objectMapper.readTree(cleanJson.trim());
            boolean isNewSchema = root.has("experiencia_cliente")
                    || root.has("analisis_contenido")
                    || root.has("calidad_agente");

            if (!isNewSchema) {
                return parseLegacySchema(root);
            }
            return parseNewSchema(root);

        } catch (Exception e) {
            log.error("Error parsing analysis response: {}", e.getMessage());
            return createMockAnalysis();
        }
    }

    private AnalysisResult parseLegacySchema(JsonNode root) {
        AnalysisResult result = new AnalysisResult();
        result.setSaleCompleted(root.has("saleCompleted") && root.get("saleCompleted").asBoolean());
        result.setSaleStatus(root.has("saleStatus") ? root.get("saleStatus").asText() : "NO_SALE");
        result.setAnalysisConfidence(root.has("analysisConfidence") ? root.get("analysisConfidence").asInt() : 50);
        if (root.has("confidenceTrace") && !root.get("confidenceTrace").isNull()) {
            result.setConfidenceTrace(root.get("confidenceTrace").toString());
        }
        result.setSaleEvidence(root.has("saleEvidence") ? root.get("saleEvidence").asText() : null);
        if (root.has("saleEvidenceMeta") && !root.get("saleEvidenceMeta").isNull()) {
            result.setSaleEvidenceMeta(root.get("saleEvidenceMeta").toString());
        }
        result.setNoSaleReason(root.has("noSaleReason") && !root.get("noSaleReason").isNull()
                ? root.get("noSaleReason").asText() : null);
        result.setProductsDiscussed(jsonArrayToList(root.get("productsDiscussed")));
        result.setCustomerObjections(jsonArrayToList(root.get("customerObjections")));
        result.setImprovementSuggestions(jsonArrayToList(root.get("improvementSuggestions")));
        result.setExecutiveSummary(root.has("executiveSummary") ? root.get("executiveSummary").asText() : "");
        result.setSellerScore(root.has("sellerScore") ? root.get("sellerScore").asInt() : 5);
        result.setSellerStrengths(jsonArrayToList(root.get("sellerStrengths")));
        result.setSellerWeaknesses(jsonArrayToList(root.get("sellerWeaknesses")));
        result.setFollowUpRecommendation(root.has("followUpRecommendation")
                ? root.get("followUpRecommendation").asText() : null);
        result.setAnalysisPayload(root.toString());
        return result;
    }

    private AnalysisResult parseNewSchema(JsonNode root) throws JsonProcessingException {
        JsonNode experiencia = root.path("experiencia_cliente");
        JsonNode contenido = root.path("analisis_contenido");
        JsonNode calidad = root.path("calidad_agente");

        String solucion = normalizedText(calidad, "ofrece_solucion_concreta", "ofrece solución concreta");
        String abandono = normalizedText(experiencia, "riesgo_abandono_baja", "riesgo de abandono o baja", "riesgo_abandono");
        String friccionTipo = normalizedText(experiencia, "tipo_friccion_detectada", "tipo de fricción detectada");
        String motivo = firstNonBlank(
                text(contenido, "motivo_principal_contacto", "motivo principal de contacto"),
                "Sin clasificar"
        );
        String categoria = firstNonBlank(
                text(contenido, "categoria_general", "categoría general"),
                "otro"
        );

        AnalysisResult result = new AnalysisResult();
        boolean saleCompleted = "si".equals(solucion) || "sí".equals(solucion);
        result.setSaleCompleted(saleCompleted);
        if (saleCompleted) {
            result.setSaleStatus("SALE_CONFIRMED");
        } else if ("parcial".equals(solucion)) {
            result.setSaleStatus("ADVANCE_NO_CLOSE");
        } else if ("alto".equals(abandono)) {
            result.setSaleStatus("NO_SALE");
        } else {
            result.setSaleStatus("SALE_LIKELY");
        }

        int sentimentScore = intValue(experiencia, 3, "score_sentimiento_general", "score de sentimiento general");
        int qualityScore = intValue(calidad, 3, "score_general_calidad_agente", "score general de calidad del agente");
        int confidence = Math.max(20, Math.min(100, 45 + (qualityScore * 8) + (sentimentScore * 4)));
        result.setAnalysisConfidence(confidence);
        result.setConfidenceTrace(createSimpleConfidenceTrace(confidence, sentimentScore, qualityScore, root));

        List<String> fricciones = asStringList(experiencia, "tipo_friccion_detectada", "tipo de fricción detectada");
        List<String> indicadoresFriccion = asStringList(experiencia, "indicadores_textuales_friccion", "indicadores textuales de fricción");
        List<String> crisis = asStringList(contenido, "presencia_palabras_asociadas", "presencia de palabras asociadas");

        result.setSaleEvidence(firstNonBlank(
                firstString(indicadoresFriccion),
                saleCompleted ? "Resolución concreta detectada por el modelo" : "Sin evidencia de resolución"
        ));
        result.setSaleEvidenceMeta("{}");
        result.setNoSaleReason(categoria);

        List<String> temas = new ArrayList<>();
        temas.add(motivo);
        String submotivo = text(contenido, "submotivo");
        if (submotivo != null && !submotivo.isBlank()) temas.add(submotivo.trim());
        String intencion = text(contenido, "intencion_comercial_detectada", "intención comercial detectada");
        if (intencion != null && !intencion.isBlank()) temas.add("Intención: " + intencion.trim());
        result.setProductsDiscussed(temas);

        List<String> objections = new ArrayList<>();
        objections.addAll(indicadoresFriccion);
        objections.addAll(crisis);
        result.setCustomerObjections(objections);

        List<String> improvements = new ArrayList<>();
        if (!fricciones.isEmpty()) {
            improvements.add("Reducir fricción: " + String.join(", ", fricciones));
        }
        String claridad = normalizedText(calidad, "claridad_explicaciones", "claridad en las explicaciones");
        if ("baja".equals(claridad)) improvements.add("Mejorar claridad de explicación");
        String empatia = normalizedText(calidad, "muestra_empatia", "muestra empatía");
        if ("baja".equals(empatia)) improvements.add("Incrementar empatía en la atención");
        result.setImprovementSuggestions(improvements);

        result.setExecutiveSummary(buildExecutiveSummary(experiencia, contenido, calidad));
        result.setSellerScore(Math.max(1, Math.min(10, qualityScore * 2)));
        result.setSellerStrengths(buildStrengths(calidad));
        result.setSellerWeaknesses(buildWeaknesses(calidad));
        result.setFollowUpRecommendation(firstNonBlank(
                text(experiencia, "probabilidad_recontacto", "probabilidad de recontacto"),
                text(contenido, "requirio_escalamiento", "requirió escalamiento"),
                "Revisar seguimiento de este caso"
        ));
        result.setAnalysisPayload(objectMapper.writeValueAsString(root));
        return result;
    }

    private String createSimpleConfidenceTrace(int confidence, int sentimentScore, int qualityScore, JsonNode root) {
        try {
            return objectMapper.writeValueAsString(java.util.Map.of(
                    "methodVersion", "cx_prompt_v1",
                    "confidence", confidence,
                    "inputs", java.util.Map.of(
                            "sentimentScore", sentimentScore,
                            "agentQualityScore", qualityScore,
                            "hasExperiencia", root.has("experiencia_cliente"),
                            "hasContenido", root.has("analisis_contenido"),
                            "hasCalidad", root.has("calidad_agente")
                    )
            ));
        } catch (Exception e) {
            return "{}";
        }
    }

    private List<String> jsonArrayToList(JsonNode arrayNode) {
        List<String> list = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode node : arrayNode) {
                list.add(node.asText());
            }
        }
        return list;
    }

    private List<String> asStringList(JsonNode parent, String... keys) {
        if (parent == null || parent.isMissingNode() || keys == null) return Collections.emptyList();
        for (String key : keys) {
            if (!parent.has(key) || parent.get(key).isNull()) continue;
            JsonNode node = parent.get(key);
            if (node.isArray()) {
                List<String> list = new ArrayList<>();
                for (JsonNode item : node) {
                    if (item != null && !item.isNull()) {
                        String value = item.asText("").trim();
                        if (!value.isEmpty()) list.add(value);
                    }
                }
                return list;
            }
            if (node.isObject()) {
                List<String> list = new ArrayList<>();
                node.fields().forEachRemaining(entry -> {
                    if (entry.getValue().asBoolean(false)) {
                        list.add(entry.getKey());
                    }
                });
                if (!list.isEmpty()) return list;
            }
            String text = node.asText("").trim();
            if (!text.isEmpty()) return List.of(text);
        }
        return Collections.emptyList();
    }

    private int intValue(JsonNode parent, int fallback, String... keys) {
        for (String key : keys) {
            if (parent.has(key) && parent.get(key).isNumber()) {
                return parent.get(key).asInt(fallback);
            }
            if (parent.has(key) && parent.get(key).isTextual()) {
                try {
                    return Integer.parseInt(parent.get(key).asText().trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return fallback;
    }

    private String normalizedText(JsonNode parent, String... keys) {
        String value = text(parent, keys);
        if (value == null) return null;
        String normalized = value.toLowerCase()
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u");
        return normalized.trim();
    }

    private String text(JsonNode parent, String... keys) {
        if (parent == null || parent.isMissingNode() || keys == null) return null;
        for (String key : keys) {
            if (parent.has(key) && !parent.get(key).isNull()) {
                String value = parent.get(key).asText();
                if (value != null && !value.isBlank()) return value.trim();
            }
        }
        return null;
    }

    private String firstString(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        return values.get(0);
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private String buildExecutiveSummary(JsonNode experiencia, JsonNode contenido, JsonNode calidad) {
        String motivo = firstNonBlank(
                text(contenido, "motivo_principal_contacto", "motivo principal de contacto"),
                "consulta general"
        );
        String categoria = firstNonBlank(text(contenido, "categoria_general", "categoría general"), "otro");
        String solucion = firstNonBlank(text(calidad, "ofrece_solucion_concreta", "ofrece solución concreta"), "no informado");
        String sentimientoFinal = firstNonBlank(text(experiencia, "sentimiento_final_cliente", "sentimiento final del cliente"), "no definido");
        return String.format(
                "El caso se clasifica como %s con motivo principal '%s'. El agente ofrece solución: %s. El sentimiento final del ciudadano se interpreta como %s.",
                categoria, motivo, solucion, sentimientoFinal
        );
    }

    private List<String> buildStrengths(JsonNode calidad) {
        List<String> strengths = new ArrayList<>();
        if ("si".equals(normalizedText(calidad, "agente_saluda_correctamente", "el agente saluda correctamente"))) {
            strengths.add("Saludo correcto");
        }
        if ("si".equals(normalizedText(calidad, "se_identifica", "se identifica"))) {
            strengths.add("Se identifica correctamente");
        }
        String empatia = normalizedText(calidad, "muestra_empatia", "muestra empatía");
        if ("alta".equals(empatia) || "media".equals(empatia)) strengths.add("Buen nivel de empatía");
        String claridad = normalizedText(calidad, "claridad_explicaciones", "claridad en las explicaciones");
        if ("alta".equals(claridad) || "media".equals(claridad)) strengths.add("Claridad en las explicaciones");
        if (strengths.isEmpty()) strengths.add("Sin fortalezas explícitas detectables");
        return strengths;
    }

    private List<String> buildWeaknesses(JsonNode calidad) {
        List<String> weaknesses = new ArrayList<>();
        if ("no".equals(normalizedText(calidad, "agente_saluda_correctamente", "el agente saluda correctamente"))) {
            weaknesses.add("No realiza saludo formal");
        }
        if ("no".equals(normalizedText(calidad, "se_identifica", "se identifica"))) {
            weaknesses.add("No se identifica");
        }
        if ("si".equals(normalizedText(calidad, "uso_excesivo_tecnicismos", "uso excesivo de tecnicismos"))) {
            weaknesses.add("Uso excesivo de tecnicismos");
        }
        String claridad = normalizedText(calidad, "claridad_explicaciones", "claridad en las explicaciones");
        if ("baja".equals(claridad)) weaknesses.add("Baja claridad al explicar");
        if (weaknesses.isEmpty()) weaknesses.add("Sin debilidades críticas detectables");
        return weaknesses;
    }

    private AnalysisResult createMockAnalysis() {
        AnalysisResult result = new AnalysisResult();
        result.setSaleCompleted(false);
        result.setSaleStatus("UNINTERPRETABLE");
        result.setAnalysisConfidence(0);
        result.setSaleEvidence("Análisis no disponible");
        result.setNoSaleReason("Análisis pendiente - API Key no configurada");
        result.setProductsDiscussed(new ArrayList<>());
        result.setCustomerObjections(new ArrayList<>());
        result.setImprovementSuggestions(Arrays.asList("Configurar API Key de OpenAI para análisis completo"));
        result.setExecutiveSummary("Análisis no disponible - Se requiere configurar la API Key de OpenAI");
        result.setSellerScore(5);
        result.setSellerStrengths(new ArrayList<>());
        result.setSellerWeaknesses(new ArrayList<>());
        result.setFollowUpRecommendation("Pendiente de análisis");
        result.setAnalysisPayload("{}");
        return result;
    }
}
