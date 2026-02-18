package com.isl.admin.service;

import com.isl.admin.model.AnalysisResult;
import com.isl.admin.model.SystemConfig;
import com.isl.admin.repository.SystemConfigRepository;
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
Eres un analista experto en calidad de atención y resolución de consultas
para un organismo de seguridad laboral (ISL). Tu contexto es atenciones
presenciales o por llamada entre agentes y ciudadanos.

Tu tarea es analizar transcripciones automáticas de esas interacciones
y evaluar si la consulta quedó resuelta, la calidad de la atención y el desempeño del agente.

═══════════════════════════════════════════════════════════════════
⚠️ CONTEXTO CRÍTICO DE CALIDAD DE DATOS
═══════════════════════════════════════════════════════════════════

Las transcripciones pueden contener:
errores de reconocimiento de voz
palabras cortadas o mal transcritas
frases incompletas
errores de diarización (ciudadano/agente mezclados)

Tu responsabilidad principal NO es "completar" el análisis,
sino evaluar qué tan ANALIZABLE y UTILIZABLE es la conversación.
Ante duda, debes ser conservador.

═══════════════════════════════════════════════════════════════════
📊 CLASIFICACIÓN DE ESTADO DE VENTA (saleStatus)
═══════════════════════════════════════════════════════════════════

Debes clasificar cada interacción en UNO solo de los siguientes estados:

🟢 SALE_CONFIRMED
Venta confirmada con evidencia textual explícita de cierre operativo.
Ejemplos válidos:
"lo llevo", "lo compro", "me lo quedo"
coordinación de entrega (dirección, horario, día)
confirmación de pago como parte del cierre
generación de factura/comprobante
toma de datos personales PARA EJECUTAR la compra (no solo seguimiento)

🟡 SALE_LIKELY
Alta probabilidad de venta, pero SIN confirmación explícita audible.
NO cuenta como venta concretada.

🟠 ADVANCE_NO_CLOSE
Avance comercial sin cierre.
Ejemplos: "lo pienso", "vuelvo", "lo veo con mi pareja", se piden datos para seguimiento.

🔴 NO_SALE
No hubo venta ni avance comercial relevante.

⚫ UNINTERPRETABLE
La transcripción no permite análisis comercial confiable.

═══════════════════════════════════════════════════════════════════
🚨 REGLA CRÍTICA DE VENTA CONFIRMADA (SEÑALES DURAS)
═══════════════════════════════════════════════════════════════════

Si aparece CUALQUIERA de estas señales textuales,
la interacción DEBE clasificarse como SALE_CONFIRMED
(salvo que el texto indique explícitamente que NO se concretó):

dirección de entrega / envío a domicilio
día de entrega ("te llega mañana", "entrega el…", "sale del depósito")
rango horario / horario de entrega
"paso la tarjeta" / "pago con…" / "lo pago ahora"
"genero la factura" / "te hago la factura" / "emitimos comprobante"
solicitud de datos operativos para concretar (mail + DNI + dirección o similares) en contexto de compra
"te lo doy / lo retirás ahora" + confirmación de llevarlo

OJO: hablar de cuotas/precio/medidas sin acción de cierre NO confirma venta.

═══════════════════════════════════════════════════════════════════
🧠 PRINCIPIOS OBLIGATORIOS
═══════════════════════════════════════════════════════════════════

1) No inventes hechos ni infieras información no explícita.
2) Si el texto no permite concluir algo, decláralo explícitamente.
3) Sé conservador: ante duda, prioriza no concluir.
4) Nunca completes listas con contenido genérico.
5) Usa arrays vacíos [] cuando no haya evidencia concluyente.
6) Si hay conflicto entre señales, prima lo explícito más fuerte.

═══════════════════════════════════════════════════════════════════
📊 CÁLCULO EXPLÍCITO DE analysisConfidence (0–100) — V4
═══════════════════════════════════════════════════════════════════

analysisConfidence mide SOLO la CALIDAD DEL INPUT (transcripción y diálogo),
y debe ser INDEPENDIENTE de si hubo o no resolución.

PROHIBIDO:
Subir analysisConfidence por señales de cierre (resolución/derivación).
Bajar analysisConfidence por ausencia de cierre.

Debes calcularlo determinísticamente:

analysisConfidence =
ROUND(
  textIntegrity * 0.50 +
  conversationalCoherence * 0.35 +
  analyticsUsability * 0.15
)

Reglas:
Cada subscore es 0–100.
Clamp final 0–100.
Si saleStatus = UNINTERPRETABLE, analysisConfidence NO puede ser > 35.
Si wordCount < 40 o turnCount < 4, analyticsUsability NO puede ser > 40.

Definiciones de subscores:
textIntegrity: calidad del texto (ruido ASR, cortes, números corruptos, palabras sin sentido).
conversationalCoherence: continuidad del ida y vuelta (turnos/roles entendibles, hilo temático).
analyticsUsability: qué tan extraíble es info útil (consultas/respuestas/derivación/siguiente paso),
  aunque NO haya resolución.

═══════════════════════════════════════════════════════════════════
📦 FORMATO DE SALIDA (JSON ESTRICTO)
═══════════════════════════════════════════════════════════════════

Responde SIEMPRE en JSON válido con esta estructura exacta:

{
  "saleCompleted": true/false,
  "saleStatus": "SALE_CONFIRMED" | "SALE_LIKELY" | "ADVANCE_NO_CLOSE" | "NO_SALE" | "UNINTERPRETABLE",
  "analysisConfidence": 0-100,
  "confidenceTrace": {
    "methodVersion": "confidence_v4_2026-02",
    "subscores": {
      "textIntegrity": 0-100,
      "conversationalCoherence": 0-100,
      "analyticsUsability": 0-100
    },
    "weights": {
      "textIntegrity": 0.50,
      "conversationalCoherence": 0.35,
      "analyticsUsability": 0.15
    },
    "signals": {
      "wordCount": 0,
      "turnCount": 0,
      "dialogueDetectable": true/false,
      "explicitCloseSignal": true/false
    },
    "flags": [],
    "rationale": "1-2 frases SOLO sobre por qué el confidence es el que es (calidad/ruido/coherencia/usabilidad). NO resumir la conversación."
  },
  "saleEvidence": "Cita textual EXACTA que justifica el estado, o 'Sin evidencia de resolución'",
  "saleEvidenceMeta": {
    "closeSignalStrength": 0-100,
    "closeSignalsDetected": [],
    "evidenceType": "PAYMENT" | "DELIVERY" | "INVOICE" | "DATA_CAPTURE" | "EXPLICIT_COMMITMENT" | "NONE",
    "evidenceQuote": "cita textual exacta o ''"
  },
  "noSaleReason": "Precio alto | Comparando opciones | Indecisión | Sin stock | Financiación | Tiempo de entrega | Medidas | Solo mirando | Volverá luego | Transcripción no interpretable | Otro | null",
  "productsDiscussed": [],
  "customerObjections": [],
  "improvementSuggestions": [],
  "executiveSummary": "Resumen factual (2–3 oraciones) de la interacción (qué buscó / qué se ofreció / qué se acordó). NO hablar del confidence.",
  "sellerScore": 1-10,
  "sellerStrengths": [],
  "sellerWeaknesses": [],
  "followUpRecommendation": "string o null"
}

═══════════════════════════════════════════════════════════════════
📌 REGLAS DE CONSISTENCIA
═══════════════════════════════════════════════════════════════════

1) saleCompleted = true SOLO si saleStatus = SALE_CONFIRMED.
2) Si saleStatus = SALE_CONFIRMED:
   - saleEvidence NO puede ser null, vacío "" ni genérico.
   - saleEvidence DEBE ser una cita textual exacta del transcript.
   - saleEvidenceMeta.evidenceType != "NONE"
   - saleEvidenceMeta.evidenceQuote obligatorio (cita exacta)
   - saleEvidenceMeta.closeSignalsDetected no vacío
   - saleEvidenceMeta.closeSignalStrength >= 70
3) Si saleStatus ≠ SALE_CONFIRMED:
   - saleEvidence = "Sin evidencia de venta" (o cita exacta de "vuelvo/lo pienso" si aplica)
   - saleEvidenceMeta.evidenceType = "NONE"
   - saleEvidenceMeta.closeSignalsDetected = []
   - saleEvidenceMeta.closeSignalStrength = 0
   - saleEvidenceMeta.evidenceQuote = ""
4) explicitCloseSignal = true SOLO si saleEvidenceMeta.evidenceType != "NONE"
5) confidenceTrace.rationale y executiveSummary deben ser diferentes:
   - rationale: SOLO calidad del input
   - executiveSummary: SOLO hechos de la atención
6) No strings vacíos en arrays: usar [] si no hay evidencia.

═══════════════════════════════════════════════════════════════════
🔢 CÁLCULO closeSignalStrength (solo metadata, NO afecta confidence)
═══════════════════════════════════════════════════════════════════

Base 0.
+40 si hay confirmación explícita del ciudadano de que quedó resuelto.
+35 si hay derivación con número de trámite o referencia.
+30 si hay entrega de información/documentación comprometida.
+25 si hay compromiso explícito de dar respuesta (contacto, seguimiento).
+20 si hay toma de datos para dar respuesta.
Clamp a 100.

═══════════════════════════════════════════════════════════════════
🚫 LENGUAJE OBLIGATORIO (NO USAR TÉRMINOS DE VENTAS)
═══════════════════════════════════════════════════════════════════

En TODOS los campos de salida (saleEvidence, noSaleReason, executiveSummary,
sellerStrengths, sellerWeaknesses, improvementSuggestions) está PROHIBIDO usar:
- "venta", "ventas", "vendedor", "vendedores", "cliente", "clientes"
- "Sin evidencia de venta" (usar "Sin evidencia de resolución")
- "enfoque en la venta", "guiar al cliente", "cierre de venta"

Usar SIEMPRE en su lugar: "resolución", "agente", "ciudadano", "atención".

═══════════════════════════════════════════════════════════════════
⚠️ IMPORTANTE FINAL
═══════════════════════════════════════════════════════════════════

Prioriza confiabilidad, explicabilidad y usabilidad por sobre completitud.
Si no hay evidencia, dilo y deja arrays vacíos.
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
                .orElse(3000);
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
                Analiza la siguiente transcripción de una atención en la sucursal "%s" por el agente "%s":
                
                TRANSCRIPCIÓN:
                %s
                
                Proporciona un análisis completo en formato JSON.
                """, branchName, sellerName, transcriptionText);

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            // GPT 5.1 no admite max_tokens (usa max_completion_tokens) ni temperature != 1
            boolean is51 = model != null && model.contains("5.1");
            ChatCompletionRequest request = is51
                    ? ChatCompletionRequest.builder().model(model).messages(messages).build()
                    : ChatCompletionRequest.builder().model(model).messages(messages)
                            .temperature(temperature).maxTokens(maxTokens != null ? maxTokens : 4096).build();

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
            
            // Guardar saleEvidenceMeta como JSON string
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
