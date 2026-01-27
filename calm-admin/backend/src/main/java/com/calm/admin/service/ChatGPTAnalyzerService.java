package com.calm.admin.service;

import com.calm.admin.model.AnalysisResult;
import com.calm.admin.model.SystemConfig;
import com.calm.admin.repository.SystemConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ChatGPTAnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(ChatGPTAnalyzerService.class);

    private static final String PROMPT_KEY = "analysis_prompt";
    private static final String MODEL_KEY = "openai_model";
    private static final String TEMPERATURE_KEY = "openai_temperature";
    private static final String MAX_TOKENS_KEY = "openai_max_tokens";

    private static final String DEFAULT_PROMPT = """
Eres un experto analista de ventas de colchones para la empresa CALM. 
Tu tarea es analizar transcripciones de interacciones entre vendedores y clientes en tiendas físicas.

Debes responder SIEMPRE en formato JSON válido con la siguiente estructura exacta:
{
    "saleCompleted": true/false,
    "noSaleReason": "string o null si hubo venta",
    "productsDiscussed": ["producto1", "producto2"],
    "customerObjections": ["objeción1", "objeción2"],
    "improvementSuggestions": ["sugerencia1", "sugerencia2"],
    "executiveSummary": "Resumen ejecutivo de la interacción",
    "sellerScore": 1-10,
    "sellerStrengths": ["fortaleza1", "fortaleza2"],
    "sellerWeaknesses": ["debilidad1", "debilidad2"],
    "followUpRecommendation": "Recomendación de seguimiento si no hubo venta"
}

CRITERIOS DE EVALUACIÓN PARA sellerScore (1-10):
- 1-3: Atención deficiente, no muestra interés, no conoce productos
- 4-5: Atención básica, responde preguntas pero no propone
- 6-7: Buena atención, explica productos, intenta cerrar
- 8-9: Excelente atención, maneja objeciones, técnicas de venta
- 10: Excepcional, cierra venta con upselling/cross-selling

Para noSaleReason, categoriza en una de estas opciones si aplica:
- "Precio alto"
- "Comparando opciones"
- "Indecisión"
- "Sin stock"
- "Financiación"
- "Tiempo de entrega"
- "Medidas"
- "Solo mirando"
- "Otro"
""";

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String defaultModel;

    private OpenAiService openAiService;
    private final ObjectMapper objectMapper;
    private final SystemConfigRepository configRepository;

    public ChatGPTAnalyzerService(ObjectMapper objectMapper, SystemConfigRepository configRepository) {
        this.objectMapper = objectMapper;
        this.configRepository = configRepository;
    }

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.equals("sk-placeholder") && !apiKey.isEmpty()) {
            this.openAiService = new OpenAiService(apiKey, Duration.ofSeconds(120));
            log.info("OpenAI service initialized with model: {}", defaultModel);
        } else {
            log.warn("OpenAI API key not configured. Analysis will be disabled.");
        }
    }

    private String getSystemPrompt() {
        return configRepository.findByConfigKey(PROMPT_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(DEFAULT_PROMPT);
    }

    private String getModel() {
        return configRepository.findByConfigKey(MODEL_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultModel);
    }

    private Double getTemperature() {
        return configRepository.findByConfigKey(TEMPERATURE_KEY)
                .map(c -> Double.parseDouble(c.getConfigValue()))
                .orElse(0.3);
    }

    private Integer getMaxTokens() {
        return configRepository.findByConfigKey(MAX_TOKENS_KEY)
                .map(c -> Integer.parseInt(c.getConfigValue()))
                .orElse(2000);
    }

    public AnalysisResult analyzeTranscription(String transcriptionText, String sellerName, String branchName) {
        if (openAiService == null) {
            log.warn("OpenAI service not initialized, returning mock analysis");
            return createMockAnalysis();
        }

        try {
            String systemPrompt = getSystemPrompt();
            String model = getModel();
            Double temperature = getTemperature();
            Integer maxTokens = getMaxTokens();

            String userPrompt = String.format("""
                Analiza la siguiente transcripción de una atención en la sucursal "%s" por el vendedor "%s":
                
                TRANSCRIPCIÓN:
                %s
                
                Proporciona un análisis completo en formato JSON.
                """, branchName, sellerName, transcriptionText);

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(messages)
                    .temperature(temperature)
                    .maxTokens(maxTokens)
                    .build();

            String response = openAiService.createChatCompletion(request)
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();

            log.info("Received analysis response from ChatGPT");
            return parseAnalysisResponse(response);

        } catch (Exception e) {
            log.error("Error analyzing transcription with ChatGPT: {}", e.getMessage());
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

            AnalysisResult result = new AnalysisResult();
            result.setSaleCompleted(root.has("saleCompleted") && root.get("saleCompleted").asBoolean());
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
            return result;

        } catch (Exception e) {
            log.error("Error parsing analysis response: {}", e.getMessage());
            return createMockAnalysis();
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

    private AnalysisResult createMockAnalysis() {
        AnalysisResult result = new AnalysisResult();
        result.setSaleCompleted(false);
        result.setNoSaleReason("Análisis pendiente - API Key no configurada");
        result.setProductsDiscussed(Arrays.asList("Pendiente de análisis"));
        result.setCustomerObjections(new ArrayList<>());
        result.setImprovementSuggestions(Arrays.asList("Configurar API Key de OpenAI para análisis completo"));
        result.setExecutiveSummary("Análisis no disponible - Se requiere configurar la API Key de OpenAI");
        result.setSellerScore(5);
        result.setSellerStrengths(new ArrayList<>());
        result.setSellerWeaknesses(new ArrayList<>());
        result.setFollowUpRecommendation("Pendiente de análisis");
        return result;
    }
}
