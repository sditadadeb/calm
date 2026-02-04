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
Eres un experto analista de ventas de colchones para la empresa CALM Argentina.
Tu tarea es analizar transcripciones de interacciones entre vendedores y clientes en tiendas físicas.

⚠️ IMPORTANTE: Las transcripciones pueden tener errores de reconocimiento de voz, palabras cortadas o caracteres extraños. 
Debes interpretar el contexto general de la conversación.

═══════════════════════════════════════════════════════════════════
📊 CLASIFICACIÓN DE ESTADO DE VENTA (saleStatus):
═══════════════════════════════════════════════════════════════════

Debes clasificar cada conversación en UNO de estos estados:

🟢 SALE_CONFIRMED - Venta confirmada con evidencia explícita:
   - El cliente dice "lo llevo", "lo compro", "me lo quedo"
   - Se coordinan datos de entrega (dirección, nombre, horario)
   - Se procesa pago (tarjeta, transferencia, efectivo)
   - Se genera factura o comprobante

🟡 SALE_LIKELY - Alta probabilidad de venta pero sin confirmación explícita:
   - El cliente muestra fuerte intención pero no hay cierre grabado
   - Se discuten detalles finales sin confirmación audible
   - La conversación se corta antes del cierre pero hay señales claras

🟠 ADVANCE_NO_CLOSE - Avance comercial sin cierre:
   - El cliente está interesado pero dice "lo pienso", "vuelvo"
   - Se piden datos de contacto para seguimiento
   - Hay interés real pero no se concreta

🔴 NO_SALE - No hubo venta:
   - El cliente rechaza o no muestra interés
   - Solo consulta de precios sin avance
   - Objeciones no resueltas que terminan la conversación

⚫ UNINTERPRETABLE - Transcripción no interpretable:
   - Texto muy corto o sin contexto comercial
   - Demasiados errores de transcripción
   - No se puede determinar si hubo interacción comercial

═══════════════════════════════════════════════════════════════════
🎯 SEÑALES CLAVE PARA DETECTAR VENTA CONFIRMADA:
═══════════════════════════════════════════════════════════════════

⚠️ REGLA CRÍTICA: Si aparece CUALQUIERA de estas frases → SALE_CONFIRMED:
- "dirección de entrega" o "direccion de entrega" 
- "nombre y apellido" (para facturación/entrega)
- "te llega mañana" / "llegando mañana" / "entregado para mañana"
- "rango horario" / "horario de entrega"
- "sale del depósito" / "envío a domicilio"
- "paso la tarjeta" / "genero la factura"

═══════════════════════════════════════════════════════════════════
📝 REGLAS DE CALIDAD DE DATOS:
═══════════════════════════════════════════════════════════════════

⚠️ REGLAS CRÍTICAS - NO INVENTAR DATOS:
- Si NO hay objeciones mencionadas → customerObjections: []
- Si NO se mencionan productos específicos → productsDiscussed: []
- Si NO hay debilidades claras → sellerWeaknesses: []
- NUNCA completes campos con contenido genérico si no hay evidencia
- Usa arrays vacíos [] en lugar de strings vacíos o contenido inventado

═══════════════════════════════════════════════════════════════════

Debes responder SIEMPRE en formato JSON válido con la siguiente estructura exacta:
{
    "saleCompleted": true/false,
    "saleStatus": "SALE_CONFIRMED" | "SALE_LIKELY" | "ADVANCE_NO_CLOSE" | "NO_SALE" | "UNINTERPRETABLE",
    "analysisConfidence": 0-100,
    "saleEvidence": "Cita TEXTUAL EXACTA de la transcripción que justifica el saleStatus, o 'Sin evidencia de venta' si no hay",
    "noSaleReason": "string o null si hubo venta",
    "productsDiscussed": [],
    "customerObjections": [],
    "improvementSuggestions": [],
    "executiveSummary": "Resumen ejecutivo de la interacción (2-3 oraciones)",
    "sellerScore": 1-10,
    "sellerStrengths": [],
    "sellerWeaknesses": [],
    "followUpRecommendation": "Recomendación de seguimiento si corresponde, o null"
}

📊 CRITERIOS PARA analysisConfidence (0-100):
- 90-100: Transcripción clara, señales explícitas, alta certeza
- 70-89: Transcripción buena, algunas ambigüedades menores
- 50-69: Transcripción con errores pero interpretable
- 30-49: Transcripción confusa, conclusiones con incertidumbre
- 0-29: Transcripción muy pobre, análisis muy incierto

📊 RELACIÓN saleCompleted ↔ saleStatus:
- saleCompleted=true SI saleStatus es SALE_CONFIRMED o SALE_LIKELY
- saleCompleted=false SI saleStatus es ADVANCE_NO_CLOSE, NO_SALE o UNINTERPRETABLE

CRITERIOS DE EVALUACIÓN PARA sellerScore (1-10):
- 1-3: Atención deficiente, no muestra interés, no conoce productos
- 4-5: Atención básica, responde preguntas pero no propone activamente
- 6-7: Buena atención, explica productos, intenta cerrar venta
- 8-9: Excelente atención, maneja objeciones, logra cerrar o casi cierra
- 10: Excepcional, cierra venta con valor agregado (upselling/cross-selling)

Para noSaleReason (solo si saleCompleted=false), usa una de estas categorías:
- "Precio alto"
- "Comparando opciones"  
- "Indecisión"
- "Sin stock"
- "Financiación"
- "Tiempo de entrega"
- "Medidas"
- "Solo mirando"
- "Volverá luego"
- "Transcripción no interpretable"
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
            AnalysisResult result = parseAnalysisResponse(response);
            
            // Post-processing: Override ChatGPT decision if clear sale signals are detected
            String saleSignal = detectSaleSignals(transcriptionText);
            if (saleSignal != null && !result.isSaleCompleted()) {
                log.info("Sale signal detected by keyword matching, overriding ChatGPT decision: {}", saleSignal);
                result.setSaleCompleted(true);
                result.setSaleStatus("SALE_CONFIRMED");
                result.setSaleEvidence("Detectado por palabras clave: " + saleSignal);
                result.setNoSaleReason(null);
                // Aumentar confianza ya que es detección por palabras clave directa
                if (result.getAnalysisConfidence() < 80) {
                    result.setAnalysisConfidence(80);
                }
            }
            
            return result;

        } catch (Exception e) {
            log.error("Error analyzing transcription with ChatGPT: {}", e.getMessage());
            return createMockAnalysis();
        }
    }
    
    /**
     * Detects clear sale signals in the transcription text using keyword matching.
     * This acts as a safety net when ChatGPT fails to detect obvious sales.
     * @return The detected signal phrase, or null if no clear sale signal found
     */
    private String detectSaleSignals(String text) {
        if (text == null) return null;
        
        String lowerText = text.toLowerCase()
                .replace("ã¡", "a").replace("ã©", "e").replace("ã­", "i")
                .replace("ã³", "o").replace("ãº", "u").replace("ã±", "n");
        
        // Phrases that ONLY appear when a sale is being processed
        String[][] saleSignals = {
            {"direccion de entrega", "dirección de entrega"},
            {"nombre y apellido"},
            {"te llega manana", "te llega mañana", "llegando manana", "llegando mañana"},
            {"entregado para manana", "entregado para mañana"},
            {"rango horario de"},
            {"coordinamos el envio", "coordinamos el envío"},
            {"sale del deposito", "sale del depósito"},
            {"genero la factura"},
            {"paso la tarjeta", "pasame la tarjeta"},
            {"te queda en", "te quedaria en"}  // Price confirmation
        };
        
        for (String[] signals : saleSignals) {
            for (String signal : signals) {
                if (lowerText.contains(signal)) {
                    return signal;
                }
            }
        }
        
        // Combined signals: if address AND tomorrow/delivery mentioned
        boolean hasDeliveryMention = lowerText.contains("envio") || lowerText.contains("envío") || 
                                     lowerText.contains("entrega") || lowerText.contains("domicilio");
        boolean hasTomorrowMention = lowerText.contains("manana") || lowerText.contains("mañana");
        boolean hasNameRequest = lowerText.contains("nombre") || lowerText.contains("apellido");
        
        if (hasDeliveryMention && hasTomorrowMention && hasNameRequest) {
            return "Combinación: nombre + entrega + mañana";
        }
        
        return null;
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
            result.setSaleStatus(root.has("saleStatus") ? root.get("saleStatus").asText() : "NO_SALE");
            result.setAnalysisConfidence(root.has("analysisConfidence") ? root.get("analysisConfidence").asInt() : 50);
            result.setSaleEvidence(root.has("saleEvidence") ? root.get("saleEvidence").asText() : null);
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
        return result;
    }
}
