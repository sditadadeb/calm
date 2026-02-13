package com.calm.admin.service;

import com.calm.admin.model.AnalysisResult;
import com.calm.admin.model.SystemConfig;
import com.calm.admin.repository.SystemConfigRepository;
import com.fasterxml.jackson.core.JsonParser;
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
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
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
y debe ser INDEPENDIENTE de si hubo o no venta.

PROHIBIDO:
Subir analysisConfidence por señales de cierre (pago/envío/datos/factura).
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
analyticsUsability: qué tan extraíble es info útil (productos/precio/objeciones/siguiente paso),
  aunque NO haya venta.

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
  "saleEvidence": "Cita textual EXACTA que justifica el estado, o 'Sin evidencia de venta'",
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
   - executiveSummary: SOLO hechos comerciales
6) No strings vacíos en arrays: usar [] si no hay evidencia.

═══════════════════════════════════════════════════════════════════
🔢 CÁLCULO closeSignalStrength (solo metadata, NO afecta confidence)
═══════════════════════════════════════════════════════════════════

Base 0.
+40 si hay pago explícito ("pago con…", "paso la tarjeta", "lo pago ahora").
+35 si hay entrega/envío con coordinación ("dirección", "mañana", "horario", "envío a domicilio").
+30 si hay factura/comprobante.
+25 si hay compromiso explícito ("lo llevo", "lo compro", "me lo quedo").
+20 si hay toma de datos operativos (mail + DNI + dirección) en contexto de compra.
Clamp a 100.

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
            return createErrorAnalysis("API Key de OpenAI no configurada");
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

            // Modelos 5.x no soportan max_tokens ni temperature custom
            // Solo aceptan defaults (temperature=1, sin max_tokens)
            boolean isNewModel = model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4");
            
            ChatCompletionRequest.ChatCompletionRequestBuilder requestBuilder = ChatCompletionRequest.builder()
                    .model(model)
                    .messages(messages);
            
            if (!isNewModel) {
                requestBuilder.temperature(temperature);
                requestBuilder.maxTokens(maxTokens);
            }
            
            ChatCompletionRequest request = requestBuilder.build();

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
                if (result.getAnalysisConfidence() < 80) {
                    result.setAnalysisConfidence(80);
                }
            }
            
            return result;

        } catch (Exception e) {
            log.error("Error analyzing transcription with ChatGPT: {}", e.getMessage(), e);
            return createErrorAnalysis("Error en análisis GPT: " + e.getMessage());
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

    /**
     * Extrae el bloque JSON de la respuesta de GPT (puede venir con markdown, texto extra, etc.)
     */
    private String extractJsonBlock(String response) {
        String json = response;
        
        // Extraer de bloques de código markdown
        if (json.contains("```json")) {
            json = json.substring(json.indexOf("```json") + 7);
            int endIdx = json.indexOf("```");
            if (endIdx > 0) json = json.substring(0, endIdx);
        } else if (json.contains("```")) {
            json = json.substring(json.indexOf("```") + 3);
            int endIdx = json.indexOf("```");
            if (endIdx > 0) json = json.substring(0, endIdx);
        }
        
        // Si no encontramos { al inicio, buscar el primer {
        json = json.trim();
        int firstBrace = json.indexOf('{');
        if (firstBrace > 0) {
            json = json.substring(firstBrace);
        }
        
        // Asegurar que termina en } (truncamiento de GPT)
        int lastBrace = json.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < json.length() - 1) {
            json = json.substring(0, lastBrace + 1);
        }
        
        return json;
    }
    
    /**
     * Repara JSON malformado que GPT a veces genera.
     * Corrige: trailing commas, missing commas, smart quotes, 
     * Python-style booleans, line endings, truncamiento, etc.
     */
    private String repairJson(String json) {
        // === FASE 1: Limpieza de caracteres ===
        // Comillas tipográficas
        json = json.replace('\u201C', '"').replace('\u201D', '"');
        json = json.replace('\u2018', '\'').replace('\u2019', '\'');
        // Guiones especiales
        json = json.replace('\u2013', '-').replace('\u2014', '-');
        // Espacios especiales
        json = json.replace('\u00A0', ' ');
        // BOM
        if (json.startsWith("\uFEFF")) json = json.substring(1);
        // Normalizar line endings
        json = json.replace("\r\n", "\n").replace("\r", "\n");
        
        // === FASE 2: Correcciones de valores ===
        // Python-style booleans/null
        json = json.replaceAll(":\\s*True\\b", ": true");
        json = json.replaceAll(":\\s*False\\b", ": false");
        json = json.replaceAll(":\\s*None\\b", ": null");
        
        // === FASE 3: Trailing commas ===
        json = json.replaceAll(",\\s*}", "}");
        json = json.replaceAll(",\\s*]", "]");
        
        // === FASE 4: Insertar comas faltantes (character-by-character) ===
        json = insertMissingCommas(json);
        
        // === FASE 5: Cerrar JSON truncado ===
        long openBraces = json.chars().filter(c -> c == '{').count();
        long closeBraces = json.chars().filter(c -> c == '}').count();
        long openBrackets = json.chars().filter(c -> c == '[').count();
        long closeBrackets = json.chars().filter(c -> c == ']').count();
        
        while (openBrackets > closeBrackets) {
            json = json + "]";
            closeBrackets++;
        }
        while (openBraces > closeBraces) {
            json = json + "}";
            closeBraces++;
        }
        
        return json;
    }
    
    // Estados del parser de reparación JSON
    private static final int ST_INITIAL = 0;
    private static final int ST_EXPECT_KEY = 1;    // Después de { o , en objeto → esperamos "key"
    private static final int ST_EXPECT_COLON = 2;  // Después de key → esperamos :
    private static final int ST_EXPECT_VALUE = 3;   // Después de : o [ o , en array → esperamos valor
    private static final int ST_AFTER_VALUE = 4;     // Después de valor → esperamos , o } o ]
    
    /**
     * Parser con máquina de estados que repara JSON malformado de GPT.
     * Entiende la estructura completa del JSON (objetos vs arrays, keys vs values)
     * y puede insertar tanto comas faltantes como dos puntos faltantes.
     * 
     * Maneja:
     * - Comas faltantes entre propiedades de objeto
     * - Comas faltantes entre elementos de array  
     * - Dos puntos faltantes entre key y value
     * - Keys sin comillas
     */
    private String insertMissingCommas(String json) {
        StringBuilder result = new StringBuilder(json.length() + 100);
        Deque<Character> stack = new ArrayDeque<>(); // '{' para objeto, '[' para array
        int i = 0;
        int len = json.length();
        int state = ST_INITIAL;
        
        while (i < len) {
            char c = json.charAt(i);
            
            // Skipear whitespace (preservándolo)
            if (Character.isWhitespace(c)) {
                result.append(c);
                i++;
                continue;
            }
            
            switch (state) {
                case ST_INITIAL:
                    if (c == '{') {
                        result.append(c); i++;
                        stack.push('{');
                        state = ST_EXPECT_KEY;
                    } else if (c == '[') {
                        result.append(c); i++;
                        stack.push('[');
                        state = ST_EXPECT_VALUE;
                    } else {
                        result.append(c); i++;
                    }
                    break;
                    
                case ST_EXPECT_KEY:
                    if (c == '"') {
                        // Key normal con comillas
                        i = readString(json, i, len, result);
                        state = ST_EXPECT_COLON;
                    } else if (c == '}') {
                        // Objeto vacío {}
                        result.append(c); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (Character.isLetter(c) || c == '_') {
                        // Key sin comillas (GPT a veces las omite)
                        int start = i;
                        while (i < len && (Character.isLetterOrDigit(json.charAt(i)) || json.charAt(i) == '_')) {
                            i++;
                        }
                        // Escribir con comillas
                        result.append('"');
                        result.append(json, start, i);
                        result.append('"');
                        state = ST_EXPECT_COLON;
                    } else {
                        // Caracter inesperado, preservar
                        result.append(c); i++;
                    }
                    break;
                    
                case ST_EXPECT_COLON:
                    if (c == ':') {
                        result.append(c); i++;
                        state = ST_EXPECT_VALUE;
                    } else {
                        // Falta el : entre key y value → insertarlo
                        result.append(':');
                        state = ST_EXPECT_VALUE;
                        // NO consumir c, se procesa como valor en ST_EXPECT_VALUE
                    }
                    break;
                    
                case ST_EXPECT_VALUE:
                    if (c == '"') {
                        i = readString(json, i, len, result);
                        state = ST_AFTER_VALUE;
                    } else if (c == '{') {
                        result.append(c); i++;
                        stack.push('{');
                        state = ST_EXPECT_KEY;
                    } else if (c == '[') {
                        result.append(c); i++;
                        stack.push('[');
                        state = ST_EXPECT_VALUE;
                    } else if (c == ']') {
                        // Array vacío o cierre de array
                        result.append(c); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == '}') {
                        // Objeto vacío o cierre (edge case con trailing comma eliminada)
                        result.append(c); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == 't' || c == 'f' || c == 'n') {
                        // Literales: true, false, null
                        int start = i;
                        while (i < len && Character.isLetter(json.charAt(i))) { i++; }
                        result.append(json, start, i);
                        state = ST_AFTER_VALUE;
                    } else if (c == '-' || Character.isDigit(c)) {
                        // Números
                        int start = i;
                        if (c == '-') { i++; }
                        while (i < len && (Character.isDigit(json.charAt(i)) || json.charAt(i) == '.'
                                || json.charAt(i) == 'e' || json.charAt(i) == 'E'
                                || json.charAt(i) == '+' || json.charAt(i) == '-')) {
                            i++;
                        }
                        result.append(json, start, i);
                        state = ST_AFTER_VALUE;
                    } else {
                        // Caracter inesperado, preservar
                        result.append(c); i++;
                    }
                    break;
                    
                case ST_AFTER_VALUE:
                    if (c == ',') {
                        result.append(c); i++;
                        // Después de coma: en objeto → esperar key, en array → esperar value
                        if (!stack.isEmpty() && stack.peek() == '{') {
                            state = ST_EXPECT_KEY;
                        } else {
                            state = ST_EXPECT_VALUE;
                        }
                    } else if (c == '}') {
                        result.append(c); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == ']') {
                        result.append(c); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else {
                        // Falta coma → insertarla
                        result.append(',');
                        if (!stack.isEmpty() && stack.peek() == '{') {
                            state = ST_EXPECT_KEY;
                        } else {
                            state = ST_EXPECT_VALUE;
                        }
                        // NO consumir c, se procesa en el nuevo estado
                    }
                    break;
            }
        }
        return result.toString();
    }
    
    /**
     * Lee un string JSON completo (respetando escapes) y lo agrega al StringBuilder.
     * Retorna la nueva posición del cursor.
     */
    private int readString(String json, int i, int len, StringBuilder result) {
        result.append(json.charAt(i)); // opening "
        i++;
        while (i < len) {
            char sc = json.charAt(i);
            result.append(sc);
            i++;
            if (sc == '\\' && i < len) {
                result.append(json.charAt(i));
                i++;
            } else if (sc == '"') {
                break;
            }
        }
        return i;
    }
    
    private AnalysisResult parseAnalysisResponse(String response) {
        try {
            String cleanJson = extractJsonBlock(response);
            
            log.info("Raw GPT JSON (first 300 chars): {}", 
                    cleanJson.length() > 300 ? cleanJson.substring(0, 300) + "..." : cleanJson);
            
            cleanJson = repairJson(cleanJson);
            
            log.info("Repaired JSON (first 300 chars): {}", 
                    cleanJson.length() > 300 ? cleanJson.substring(0, 300) + "..." : cleanJson);
            
            // Usar ObjectMapper con modo MUY leniente
            ObjectMapper lenientMapper = objectMapper.copy();
            lenientMapper.configure(JsonParser.Feature.ALLOW_TRAILING_COMMA, true);
            lenientMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
            lenientMapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
            lenientMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
            
            JsonNode root = lenientMapper.readTree(cleanJson.trim());

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
            return result;

        } catch (Exception e) {
            log.error("Error parsing analysis response: {}. Raw response (first 500 chars): {}", 
                    e.getMessage(), response != null && response.length() > 500 ? response.substring(0, 500) : response);
            return createErrorAnalysis("Error parseando respuesta de GPT: " + e.getMessage());
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

    private AnalysisResult createErrorAnalysis(String reason) {
        AnalysisResult result = new AnalysisResult();
        result.setSaleCompleted(false);
        result.setSaleStatus("UNINTERPRETABLE");
        result.setAnalysisConfidence(0);
        result.setSaleEvidence("Análisis no disponible");
        result.setNoSaleReason(reason);
        result.setProductsDiscussed(new ArrayList<>());
        result.setCustomerObjections(new ArrayList<>());
        result.setImprovementSuggestions(new ArrayList<>());
        result.setExecutiveSummary("Análisis no disponible - " + reason);
        result.setSellerScore(0);
        result.setSellerStrengths(new ArrayList<>());
        result.setSellerWeaknesses(new ArrayList<>());
        result.setFollowUpRecommendation(null);
        return result;
    }
}
