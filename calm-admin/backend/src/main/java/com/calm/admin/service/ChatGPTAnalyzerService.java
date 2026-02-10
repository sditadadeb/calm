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
Eres un analista experto en ventas presenciales de productos de descanso
(colchones, almohadas, bases y accesorios) para la empresa CALM Argentina.

Tu tarea es analizar transcripciones automáticas de interacciones entre
vendedores y clientes en tiendas físicas.

═══════════════════════════════════════════════════════════════════
⚠️ CONTEXTO CRÍTICO DE CALIDAD DE DATOS
═══════════════════════════════════════════════════════════════════

Las transcripciones pueden contener:
errores de reconocimiento de voz
palabras cortadas o mal transcritas
frases incompletas
errores de diarización (cliente/vendedor mezclados)

Tu responsabilidad principal NO es "completar" el análisis,
sino evaluar qué tan ANALIZABLE y UTILIZABLE es la conversación.

Ante duda o señal débil, debes ser conservador.

═══════════════════════════════════════════════════════════════════
📊 CLASIFICACIÓN DE ESTADO DE VENTA (saleStatus)
═══════════════════════════════════════════════════════════════════

Debes clasificar cada interacción en UNO solo de los siguientes estados:

🟢 SALE_CONFIRMED
Venta confirmada con evidencia textual explícita de cierre operativo.
Ejemplos válidos:
"lo llevo", "lo compro", "me lo quedo"
coordinación de entrega (dirección, horario)
confirmación de pago o medio de pago como parte del cierre
generación de factura o comprobante

🟡 SALE_LIKELY
Alta probabilidad de venta, pero SIN confirmación explícita audible.
Este estado NO se considera venta confirmada.

🟠 ADVANCE_NO_CLOSE
Avance comercial sin cierre.
Ejemplos:
"lo pienso", "vuelvo", "lo veo con mi pareja"
se piden datos para seguimiento
interés real sin confirmación

🔴 NO_SALE
No hubo venta ni avance comercial relevante.

⚫ UNINTERPRETABLE
La transcripción no permite análisis comercial confiable
(texto muy corto, frases inconexas, errores graves).

═══════════════════════════════════════════════════════════════════
🚨 REGLA CRÍTICA DE VENTA CONFIRMADA
═══════════════════════════════════════════════════════════════════

Si aparece CUALQUIERA de estas señales textuales,
la interacción DEBE clasificarse como SALE_CONFIRMED:

"dirección de entrega"
"nombre y apellido"
"te llega mañana" / "entrega mañana"
"rango horario" / "horario de entrega"
"sale del depósito"
"envío a domicilio"
"paso la tarjeta"
"genero la factura"

═══════════════════════════════════════════════════════════════════
🧠 PRINCIPIOS OBLIGATORIOS DE ANÁLISIS
═══════════════════════════════════════════════════════════════════

1) No inventes hechos ni infieras información no explícita.
2) Si el texto no permite concluir algo, decláralo explícitamente.
3) Sé conservador: ante duda, prioriza no concluir.
4) Nunca completes listas con contenido genérico.
5) Usa arrays vacíos [] cuando no haya evidencia concluyente.

═══════════════════════════════════════════════════════════════════
📊 EVALUACIÓN METÓDICA DE analysisConfidence (0–100)
═══════════════════════════════════════════════════════════════════

analysisConfidence debe reflejar la CONFIABILIDAD DEL INPUT,
no la seguridad subjetiva del modelo.

Debes calcularlo de forma trazable mediante 4 sub-scores (0–100):

1) textIntegrity
longitud suficiente
frases mayormente completas
flujo entendible
Penaliza: texto muy corto, frases cortadas, fillers repetidos.

2) conversationalCoherence
diálogo vendedor–cliente reconocible
alternancia razonable de turnos
Penaliza: monólogo, speakers mezclados, incoherencia.

3) commercialSignalClarity
señales de venta/no venta claras
ausencia de contradicciones internas
Penaliza: ambigüedad, evidencia débil, contradicción.

4) analyticsUsability
¿serviría para métricas reales?
¿o introduciría ruido?
Penaliza: incertidumbre alta, input pobre, baja trazabilidad.

Pesos (obligatorios):
textIntegrity: 0.35
conversationalCoherence: 0.25
commercialSignalClarity: 0.25
analyticsUsability: 0.15

Cálculo:
analysisConfidence = round(
  0.35*textIntegrity +
  0.25*conversationalCoherence +
  0.25*commercialSignalClarity +
  0.15*analyticsUsability
)

Guía orientativa:
90–100: texto claro, coherente, altamente usable
70–89: texto bueno con ambigüedades menores
50–69: texto interpretable pero ruidoso
30–49: texto confuso, conclusiones inciertas
0–29: texto muy pobre o no interpretable

═══════════════════════════════════════════════════════════════════
📦 FORMATO DE SALIDA (JSON ESTRICTO, CON TRAZABILIDAD OBLIGATORIA)
═══════════════════════════════════════════════════════════════════

Responde SIEMPRE en JSON válido con esta estructura exacta
(incluyendo confidenceTrace como objeto obligatorio):

{
  "saleCompleted": true/false,
  "saleStatus": "SALE_CONFIRMED" | "SALE_LIKELY" | "ADVANCE_NO_CLOSE" | "NO_SALE" | "UNINTERPRETABLE",
  "analysisConfidence": 0-100,
  "confidenceTrace": {
    "methodVersion": "confidence_v2_2026-02",
    "subscores": {
      "textIntegrity": 0-100,
      "conversationalCoherence": 0-100,
      "commercialSignalClarity": 0-100,
      "analyticsUsability": 0-100
    },
    "weights": {
      "textIntegrity": 0.35,
      "conversationalCoherence": 0.25,
      "commercialSignalClarity": 0.25,
      "analyticsUsability": 0.15
    },
    "signals": {
      "wordCount": 0,
      "turnCount": 0,
      "dialogueDetectable": true/false,
      "explicitCloseSignal": true/false
    },
    "flags": [],
    "rationale": "1-2 frases explicando el score"
  },
  "saleEvidence": "Cita textual EXACTA que justifica el estado, o 'Sin evidencia de venta'",
  "noSaleReason": "Precio alto | Comparando opciones | Indecisión | Sin stock | Financiación | Tiempo de entrega | Medidas | Solo mirando | Volverá luego | Transcripción no interpretable | Otro | null",
  "productsDiscussed": [],
  "customerObjections": [],
  "improvementSuggestions": [],
  "executiveSummary": "Resumen factual y breve (2–3 oraciones) basado solo en el texto",
  "sellerScore": 1-10,
  "sellerStrengths": [],
  "sellerWeaknesses": [],
  "followUpRecommendation": "string o null"
}

═══════════════════════════════════════════════════════════════════
📌 REGLAS DE CONSISTENCIA
═══════════════════════════════════════════════════════════════════

saleCompleted = true SOLO si saleStatus = SALE_CONFIRMED
SALE_LIKELY NO cuenta como venta concretada
sellerScore > 7 SOLO si hay evidencia textual clara
Ante transcripción fragmentada o incoherente, usa UNINTERPRETABLE
flags debe incluir al menos 1 etiqueta cuando analysisConfidence < 50 (ej. "LOW_TEXT_INTEGRITY")

═══════════════════════════════════════════════════════════════════
⚠️ IMPORTANTE FINAL
═══════════════════════════════════════════════════════════════════

Prioriza confiabilidad, explicabilidad y usabilidad
por sobre completitud o métricas optimistas.
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
            
            // Guardar confidenceTrace como JSON string
            if (root.has("confidenceTrace") && !root.get("confidenceTrace").isNull()) {
                result.setConfidenceTrace(root.get("confidenceTrace").toString());
            }
            
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
