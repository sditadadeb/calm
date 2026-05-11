package com.bancooccidente.admin.service;

import com.bancooccidente.admin.model.AnalysisResult;
import com.bancooccidente.admin.model.SystemConfig;
import com.bancooccidente.admin.repository.SystemConfigRepository;
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
Eres un analista experto en atención presencial bancaria para Banco de Occidente Colombia.

Tu tarea es analizar transcripciones automáticas de interacciones entre
oficiales/ejecutivos de atención y clientes en sucursales bancarias.

═══════════════════════════════════════════════════════════════════
⚠️ CONTEXTO CRÍTICO DE CALIDAD DE DATOS
═══════════════════════════════════════════════════════════════════

Las transcripciones pueden contener:
errores de reconocimiento de voz
palabras cortadas o mal transcritas
frases incompletas
errores de diarización (cliente/oficial mezclados)

Tu responsabilidad principal NO es "completar" el análisis,
sino evaluar qué tan ANALIZABLE y UTILIZABLE es la conversación.
Ante duda, debes ser conservador.

═══════════════════════════════════════════════════════════════════
📊 CLASIFICACIÓN DE ESTADO (saleStatus)
═══════════════════════════════════════════════════════════════════

🟢 SALE_CONFIRMED — Producto/servicio bancario confirmado con evidencia textual explícita.
🟡 SALE_LIKELY — Alta probabilidad, SIN confirmación explícita.
🟠 ADVANCE_NO_CLOSE — Avance sin cierre (volverá, pedirá más info, etc.).
🔴 NO_SALE — No hubo producto ofrecido ni avance comercial.
⚫ UNINTERPRETABLE — La transcripción no permite análisis confiable.

═══════════════════════════════════════════════════════════════════
🏦 TIPIFICACIÓN — MOTIVO DE VISITA (motivoVisita)
═══════════════════════════════════════════════════════════════════

Clasifica el motivo principal en UNA categoría:
"Apertura de cuenta" | "Consulta de productos" | "Solicitud de crédito / préstamo" |
"Pago / transferencia" | "Reclamo / queja" | "Cancelación de producto" |
"Actualización de datos" | "Inversiones / CDT" | "Tarjeta de crédito / débito" |
"Otro" | "No determinado"

═══════════════════════════════════════════════════════════════════
😊 ESTADO EMOCIONAL DEL CLIENTE (estadoEmocional)
═══════════════════════════════════════════════════════════════════

"Positivo" — satisfecho, tranquilo, receptivo.
"Neutro" — sin señales claras.
"Negativo" — molesto, frustrado o insatisfecho.
"No determinado" — sin evidencia suficiente.

═══════════════════════════════════════════════════════════════════
⭐ CSAT (csatScore) y ESCUCHA ACTIVA (escuchaActivaScore)
═══════════════════════════════════════════════════════════════════

csatScore: 1–5 (0 = sin evidencia). 5=Muy satisfecho, 1=Muy insatisfecho.
escuchaActivaScore: 1–10. 10=Escucha perfecta, parafrasea, valida. 1=No escucha, interrumpe.

═══════════════════════════════════════════════════════════════════
📋 PROTOCOLO DE ATENCIÓN BANCO DE OCCIDENTE (6 PASOS OFICIALES)
═══════════════════════════════════════════════════════════════════

Evalúa el cumplimiento del protocolo oficial de Banco de Occidente.
El protocolo tiene 6 pasos. Para cada uno asigna un score 0–10 y una cita textual de evidencia.

PASO 1 — SALUDO PERSONALIZADO CON NOMBRE
El oficial debe llamar al cliente por su nombre y preguntar en qué puede ayudar.
Ejemplo esperado: "Buenos días Andrés, qué gusto saludarte. ¿Cómo te encuentras? ¿En qué te puedo ayudar?"
Score 10: llamó por nombre + saludo cálido + ofrecimiento de ayuda.
Score 5: llamó por nombre pero saludo genérico, o saludó bien pero sin nombre.
Score 0: no saludó o no personalizó.

PASO 2 — ATENCIÓN Y PRESENCIA (contacto visual / prioridad al cliente)
El oficial debe demostrar que el cliente es su prioridad: no distraerse, no interrumpir.
En audio se infiere por: no hablar con terceros, responder con atención, no hacer pausas injustificadas.
Score 10: atención plena, sin interrupciones ni distracciones evidentes.
Score 5: alguna distracción o pausa sin explicación.
Score 0: múltiples interrupciones, habla con terceros, ignora al cliente.

PASO 3 — LENGUAJE SENCILLO E INDICACIÓN CUANDO VALIDA
El oficial debe usar lenguaje claro, sin tecnicismos innecesarios.
Si está digitando o consultando, debe indicarlo: "Dame un momento, lo estoy validando."
En lugar de: "El trámite no puede continuar por incumplimiento", debe decir: "Necesitamos ajustar un paso, revisemos juntos."
Score 10: lenguaje claro + avisa cuando valida/digita.
Score 5: lenguaje claro pero no avisa cuando valida, o usa términos técnicos sin explicar.
Score 0: lenguaje confuso, tecnicismos sin explicación, silencios sin contexto.

PASO 4 — ACOMPAÑAMIENTO CUANDO LA SOLUCIÓN NO DEPENDE DEL OFICIAL
Si el oficial no puede resolver directamente, debe acompañar al cliente sin que repita su caso.
Ejemplo: "Yo te acompaño en todo el proceso, no necesitas repetir tu caso en otro canal. Lo que haremos es... (mencionar 1-2 pasos)."
Score 10: explicó claramente los pasos siguientes y ofreció acompañamiento.
Score 5: derivó pero sin mencionar pasos concretos ni ofrecer acompañamiento.
Score 0: derivó al cliente sin explicación ni seguimiento.
N/A (null): la solución dependía completamente del oficial, no aplica este paso.

PASO 5 — CIERRE CONFIRMANDO IMPACTO
Antes de terminar, el oficial debe confirmar que resolvió la necesidad y ofrecer ayuda adicional.
Ejemplo: "Listo Andrés, ¿hay algo más que pueda hacer por ti hoy?" o "¿Deseas que revisemos otra gestión?"
Score 10: preguntó si había algo más + confirmó resolución.
Score 5: cerró la gestión pero no preguntó si había algo más.
Score 0: cortó la interacción sin confirmar ni ofrecer ayuda adicional.

PASO 6 — DESPEDIDA PERSONALIZADA
El oficial debe despedirse usando el nombre del cliente, de forma cálida.
Ejemplo: "Un gusto atenderte, Luis. Pasa un gran día y recuerda que estamos para apoyarte siempre."
Para casos sensibles: "Gracias por tu comprensión Luis, aquí estaré pendiente del caso."
Score 10: despedida con nombre + frase cálida personalizada.
Score 5: se despidió pero sin nombre o de forma genérica.
Score 0: no hubo despedida identificable.

CAMPOS A GENERAR:
cumplimientoProtocolo: true si el promedio de los 6 pasos >= 6.0 (excluyendo nulls).
protocoloScore: promedio ponderado de los 6 pasos * 10 (escala 0–100).
protocoloDetalle: objeto JSON con score y evidencia por cada paso (ver formato de salida).

═══════════════════════════════════════════════════════════════════
💰 EFECTIVIDAD COMERCIAL
═══════════════════════════════════════════════════════════════════

productoOfrecido: true si el oficial ofreció activamente algún producto o servicio bancario.
montoOfrecido: número en pesos colombianos si se mencionó monto de crédito/préstamo. null si no aplica.
cumplimientoLineamiento: true si el monto ofrecido >= lineamiento del banco. null si no aplica.

═══════════════════════════════════════════════════════════════════
🎙️ GRABACIÓN Y CONSENTIMIENTO
═══════════════════════════════════════════════════════════════════

grabacionCortadaCliente: true si hay evidencia de que el cliente solicitó no ser grabado.
grabacionCortadaManual: true si hay evidencia de que el oficial finalizó la grabación manualmente.

Regla crítica de calidad:
Si la grabación fue cortada, termina abruptamente, o no permite evaluar cierre/despedida,
la atención NO puede calificarse como buena aunque el saludo o los primeros pasos hayan sido correctos.
Una interacción incompleta afecta directamente lo que se mide.

Cuando detectes grabación cortada/incompleta:
- sellerScore máximo: 4/10.
- protocoloScore máximo: 50/100.
- cumplimientoProtocolo debe ser false.
- escuchaActivaScore máximo: 5/10.
- agrega en sellerWeaknesses que la atención quedó incompleta por corte/finalización anticipada.
- en executiveSummary menciona que la interacción no permite evaluar el ciclo completo de atención.

═══════════════════════════════════════════════════════════════════
🧠 PRINCIPIOS OBLIGATORIOS
═══════════════════════════════════════════════════════════════════

1) No inventes hechos ni infieras información no explícita.
2) Si el texto no permite concluir algo, decláralo.
3) Sé conservador: ante duda, prioriza no concluir.
4) Usa arrays vacíos [] cuando no haya evidencia concluyente.
5) Si hay conflicto entre señales, prima lo explícito más fuerte.

═══════════════════════════════════════════════════════════════════
📊 CÁLCULO DE analysisConfidence (0–100) — V4
═══════════════════════════════════════════════════════════════════

Mide SOLO calidad del INPUT. Independiente de si hubo venta o no.
analysisConfidence = ROUND(textIntegrity*0.50 + conversationalCoherence*0.35 + analyticsUsability*0.15)
Si saleStatus=UNINTERPRETABLE → analysisConfidence <= 35.
Si wordCount<40 o turnCount<4 → analyticsUsability <= 40.

═══════════════════════════════════════════════════════════════════
📦 FORMATO DE SALIDA (JSON ESTRICTO)
═══════════════════════════════════════════════════════════════════

{
  "saleCompleted": true/false,
  "saleStatus": "SALE_CONFIRMED" | "SALE_LIKELY" | "ADVANCE_NO_CLOSE" | "NO_SALE" | "UNINTERPRETABLE",
  "analysisConfidence": 0-100,
  "confidenceTrace": {
    "methodVersion": "confidence_v4_2026-02",
    "subscores": { "textIntegrity": 0-100, "conversationalCoherence": 0-100, "analyticsUsability": 0-100 },
    "weights": { "textIntegrity": 0.50, "conversationalCoherence": 0.35, "analyticsUsability": 0.15 },
    "signals": { "wordCount": 0, "turnCount": 0, "dialogueDetectable": true/false, "explicitCloseSignal": true/false },
    "flags": [],
    "rationale": "1-2 frases SOLO sobre calidad del input. NO resumir la conversación."
  },
  "saleEvidence": "Cita textual exacta o 'Sin evidencia de venta'",
  "saleEvidenceMeta": {
    "closeSignalStrength": 0-100,
    "closeSignalsDetected": [],
    "evidenceType": "PAYMENT" | "DELIVERY" | "INVOICE" | "DATA_CAPTURE" | "EXPLICIT_COMMITMENT" | "NONE",
    "evidenceQuote": ""
  },
  "noSaleReason": "string o null",
  "productsDiscussed": [],
  "customerObjections": [],
  "improvementSuggestions": [],
  "executiveSummary": "Resumen factual 2-3 oraciones.",
  "sellerScore": 1-10,
  "sellerStrengths": [],
  "sellerWeaknesses": [],
  "followUpRecommendation": "string o null",
  "motivoVisita": "categoría según lista",
  "estadoEmocional": "Positivo | Neutro | Negativo | No determinado",
  "csatScore": 0-5,
  "escuchaActivaScore": 1-10,
  "cumplimientoProtocolo": true/false,
  "protocoloScore": 0-100,
  "protocoloDetalle": {
    "paso1_saludo":           { "score": 0-10, "evidencia": "cita textual o null" },
    "paso2_atencion":         { "score": 0-10, "evidencia": "cita textual o null" },
    "paso3_lenguaje":         { "score": 0-10, "evidencia": "cita textual o null" },
    "paso4_acompanamiento":   { "score": 0-10, "evidencia": "cita textual o null" },
    "paso5_cierre":           { "score": 0-10, "evidencia": "cita textual o null" },
    "paso6_despedida":        { "score": 0-10, "evidencia": "cita textual o null" }
  },
  "productoOfrecido": true/false,
  "montoOfrecido": null,
  "cumplimientoLineamiento": null,
  "grabacionCortadaCliente": false,
  "grabacionCortadaManual": false
}

═══════════════════════════════════════════════════════════════════
📌 REGLAS DE CONSISTENCIA
═══════════════════════════════════════════════════════════════════

1) saleCompleted = true SOLO si saleStatus = SALE_CONFIRMED.
2) Si saleStatus = SALE_CONFIRMED: saleEvidence debe ser cita exacta, evidenceType != NONE, closeSignalStrength >= 70.
3) Si saleStatus != SALE_CONFIRMED: saleEvidence = "Sin evidencia de venta", closeSignalStrength = 0.
4) protocoloScore = promedio de scores de los 6 pasos de protocoloDetalle * 10. Si un paso tiene null score, exclúyelo del promedio.
5) cumplimientoProtocolo = true si protocoloScore >= 60.
6) No strings vacíos en arrays: usar [] si no hay evidencia.
7) Si grabacionCortadaCliente=true o grabacionCortadaManual=true, aplica siempre los topes de calidad por grabación incompleta.

Prioriza confiabilidad, explicabilidad y usabilidad por sobre completitud.
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

            // Modelos GPT-5.x y o-series no soportan max_tokens ni temperature custom
            boolean isNewModel = model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4") || model.startsWith("gpt-5.4") || model.startsWith("gpt-5.3") || model.startsWith("gpt-5.2");
            
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
            enforceIncompleteRecordingPenalty(result, transcriptionText);
            
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
                if (result.getSellerScore() <= 0) {
                    result.setSellerScore(7); // Score razonable por defecto para venta detectada
                }
            }
            
            return result;

        } catch (Exception e) {
            log.error("Error analyzing transcription with ChatGPT: {}", e.getMessage(), e);
            return createErrorAnalysis("Error en análisis GPT: " + e.getMessage());
        }
    }

    private void enforceIncompleteRecordingPenalty(AnalysisResult result, String transcriptionText) {
        if (result == null) {
            return;
        }
        boolean incompleteRecording = result.isGrabacionCortadaCliente()
                || result.isGrabacionCortadaManual()
                || hasAbruptEnding(transcriptionText);
        if (!incompleteRecording) return;

        result.setSellerScore(Math.min(result.getSellerScore(), 4));
        result.setProtocoloScore(Math.min(result.getProtocoloScore(), 50));
        result.setCumplimientoProtocolo(false);
        result.setEscuchaActivaScore(Math.min(result.getEscuchaActivaScore(), 5));
        result.setCsatScore(Math.min(result.getCsatScore(), 3));

        List<String> weaknesses = result.getSellerWeaknesses() != null
                ? new ArrayList<>(result.getSellerWeaknesses())
                : new ArrayList<>();
        String cutReason = result.isGrabacionCortadaCliente()
                ? "La atención quedó incompleta porque el cliente solicitó no continuar con la grabación."
                : "La atención quedó incompleta por corte o finalización anticipada de la grabación.";
        if (weaknesses.stream().noneMatch(w -> w != null && w.toLowerCase().contains("incompleta"))) {
            weaknesses.add(cutReason);
        }
        result.setSellerWeaknesses(weaknesses);

        String summary = result.getExecutiveSummary();
        if (summary == null || summary.isBlank()) {
            result.setExecutiveSummary(cutReason + " No se puede evaluar el ciclo completo de atención.");
        } else if (!summary.toLowerCase().contains("ciclo completo")) {
            result.setExecutiveSummary(summary + " " + cutReason + " No se puede evaluar el ciclo completo de atención.");
        }
    }

    private boolean hasAbruptEnding(String transcriptionText) {
        if (transcriptionText == null || transcriptionText.isBlank()) {
            return false;
        }

        String[] lines = transcriptionText.trim().split("\\R+");
        String lastUtterance = "";
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (!line.isBlank()) {
                int separator = line.indexOf("]:");
                lastUtterance = separator >= 0 ? line.substring(separator + 2).trim() : line;
                break;
            }
        }

        if (lastUtterance.isBlank()) {
            return false;
        }

        String normalized = lastUtterance.toLowerCase(Locale.ROOT);
        boolean hasNaturalClose = normalized.contains("gracias")
                || normalized.contains("hasta luego")
                || normalized.contains("buen dia")
                || normalized.contains("buen día")
                || normalized.contains("que estes bien")
                || normalized.contains("que estés bien");
        if (hasNaturalClose) {
            return false;
        }

        int wordCount = normalized.replaceAll("[^\\p{L}\\p{N}\\s]", " ").trim().split("\\s+").length;
        return wordCount <= 4;
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
        // Puntos suspensivos Unicode
        json = json.replace("\u2026", "...");
        // Comillas angulares
        json = json.replace("\u00AB", "\"").replace("\u00BB", "\"");
        // Apóstrofe tipográfico
        json = json.replace("\u02BC", "'");
        // Espacios especiales
        json = json.replace('\u00A0', ' ');
        json = json.replace("\u200B", "").replace("\u00AD", "");
        // BOM
        if (json.startsWith("\uFEFF")) json = json.substring(1);
        // Normalizar line endings
        json = json.replace("\r\n", "\n").replace("\r", "\n");
        
        // === FASE 2: Correcciones de valores ===
        // Python-style booleans/null
        json = json.replaceAll(":\\s*True\\b", ": true");
        json = json.replaceAll(":\\s*False\\b", ": false");
        json = json.replaceAll(":\\s*None\\b", ": null");
        
        // English number words as values (GPT sometimes writes "fifty" instead of 50)
        json = json.replaceAll("(?i):\\s*zero\\b", ": 0");
        json = json.replaceAll("(?i):\\s*one\\b", ": 1");
        json = json.replaceAll("(?i):\\s*two\\b", ": 2");
        json = json.replaceAll("(?i):\\s*three\\b", ": 3");
        json = json.replaceAll("(?i):\\s*four\\b", ": 4");
        json = json.replaceAll("(?i):\\s*five\\b", ": 5");
        json = json.replaceAll("(?i):\\s*six\\b", ": 6");
        json = json.replaceAll("(?i):\\s*seven\\b", ": 7");
        json = json.replaceAll("(?i):\\s*eight\\b", ": 8");
        json = json.replaceAll("(?i):\\s*nine\\b", ": 9");
        json = json.replaceAll("(?i):\\s*ten\\b", ": 10");
        json = json.replaceAll("(?i):\\s*twenty\\b", ": 20");
        json = json.replaceAll("(?i):\\s*thirty\\b", ": 30");
        json = json.replaceAll("(?i):\\s*forty\\b", ": 40");
        json = json.replaceAll("(?i):\\s*fifty\\b", ": 50");
        json = json.replaceAll("(?i):\\s*sixty\\b", ": 60");
        json = json.replaceAll("(?i):\\s*seventy\\b", ": 70");
        json = json.replaceAll("(?i):\\s*eighty\\b", ": 80");
        json = json.replaceAll("(?i):\\s*ninety\\b", ": 90");
        json = json.replaceAll("(?i):\\s*hundred\\b", ": 100");
        
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
                        // Cierre de objeto - fix bracket mismatch si estamos en array
                        char correct = (!stack.isEmpty() && stack.peek() == '[') ? ']' : '}';
                        result.append(correct); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == ']') {
                        // Bracket mismatch: ] en contexto de objeto → usar }
                        char correct = (!stack.isEmpty() && stack.peek() == '{') ? '}' : ']';
                        result.append(correct); i++;
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
                    } else if (c == ',') {
                        // GPT usó coma en lugar de dos puntos → reemplazar
                        result.append(':'); i++;
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
                        // Cierre de array - fix bracket mismatch si estamos en objeto
                        char correct = (!stack.isEmpty() && stack.peek() == '{') ? '}' : ']';
                        result.append(correct); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == '}') {
                        // Cierre de objeto - fix bracket mismatch si estamos en array
                        char correct = (!stack.isEmpty() && stack.peek() == '[') ? ']' : '}';
                        result.append(correct); i++;
                        if (!stack.isEmpty()) stack.pop();
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
                    } else if (Character.isLetter(c)) {
                        // Puede ser true/false/null, número en inglés, o string sin comillas
                        i = readBareValue(json, i, len, result);
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
                        // Fix bracket mismatch: si estamos en array, usar ]
                        char correct = (!stack.isEmpty() && stack.peek() == '[') ? ']' : '}';
                        result.append(correct); i++;
                        if (!stack.isEmpty()) stack.pop();
                        state = ST_AFTER_VALUE;
                    } else if (c == ']') {
                        // Fix bracket mismatch: si estamos en objeto, usar }
                        char correct = (!stack.isEmpty() && stack.peek() == '{') ? '}' : ']';
                        result.append(correct); i++;
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
    
    /**
     * Lee un valor "bare" (sin comillas) que GPT a veces genera.
     * Maneja: true/false/null (case-insensitive), números en inglés, y strings sin comillas.
     * Retorna la nueva posición del cursor.
     */
    private int readBareValue(String json, int i, int len, StringBuilder result) {
        // Leer la primera palabra (solo letras)
        int wordStart = i;
        while (i < len && Character.isLetter(json.charAt(i))) { i++; }
        String firstWord = json.substring(wordStart, i);
        String lower = firstWord.toLowerCase();
        
        // Literales JSON (case-insensitive para cubrir True/False/None de Python)
        if (lower.equals("true")) { result.append("true"); return i; }
        if (lower.equals("false")) { result.append("false"); return i; }
        if (lower.equals("null") || lower.equals("none")) { result.append("null"); return i; }
        
        // Número en inglés (fifty → 50, etc.)
        String numericValue = englishWordToNumber(lower);
        if (numericValue != null) { result.append(numericValue); return i; }
        
        // Es un string sin comillas → leer hasta delimitador estructural
        i = wordStart;
        StringBuilder value = new StringBuilder();
        while (i < len) {
            char vc = json.charAt(i);
            if (vc == ',' || vc == '}' || vc == ']') break;
            if (vc == '\n') break;
            value.append(vc);
            i++;
        }
        
        String trimmed = value.toString().trim();
        // Escapar comillas internas y envolver en comillas
        trimmed = trimmed.replace("\\", "\\\\").replace("\"", "\\\"");
        result.append('"').append(trimmed).append('"');
        log.debug("Auto-quoted bare value: {} → \"{}\"", value.toString().trim(), trimmed);
        return i;
    }
    
    /**
     * Convierte palabras numéricas en inglés a dígitos.
     */
    private String englishWordToNumber(String word) {
        return switch (word) {
            case "zero" -> "0";
            case "one" -> "1";
            case "two" -> "2";
            case "three" -> "3";
            case "four" -> "4";
            case "five" -> "5";
            case "six" -> "6";
            case "seven" -> "7";
            case "eight" -> "8";
            case "nine" -> "9";
            case "ten" -> "10";
            case "twenty" -> "20";
            case "thirty" -> "30";
            case "forty" -> "40";
            case "fifty" -> "50";
            case "sixty" -> "60";
            case "seventy" -> "70";
            case "eighty" -> "80";
            case "ninety" -> "90";
            case "hundred" -> "100";
            default -> null;
        };
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

            // Métricas Banco de Occidente
            result.setMotivoVisita(root.has("motivoVisita") && !root.get("motivoVisita").isNull()
                    ? root.get("motivoVisita").asText() : "No determinado");
            result.setEstadoEmocional(root.has("estadoEmocional") && !root.get("estadoEmocional").isNull()
                    ? root.get("estadoEmocional").asText() : "No determinado");
            result.setCsatScore(root.has("csatScore") ? root.get("csatScore").asInt(0) : 0);
            result.setEscuchaActivaScore(root.has("escuchaActivaScore") ? root.get("escuchaActivaScore").asInt(0) : 0);
            result.setCumplimientoProtocolo(root.has("cumplimientoProtocolo") && root.get("cumplimientoProtocolo").asBoolean());
            result.setProtocoloScore(root.has("protocoloScore") ? root.get("protocoloScore").asInt(0) : 0);
            result.setProductoOfrecido(root.has("productoOfrecido") && root.get("productoOfrecido").asBoolean());
            if (root.has("montoOfrecido") && !root.get("montoOfrecido").isNull()) {
                result.setMontoOfrecido(root.get("montoOfrecido").asLong(0));
            }
            if (root.has("cumplimientoLineamiento") && !root.get("cumplimientoLineamiento").isNull()) {
                result.setCumplimientoLineamiento(root.get("cumplimientoLineamiento").asBoolean());
            }
            result.setGrabacionCortadaCliente(root.has("grabacionCortadaCliente") && root.get("grabacionCortadaCliente").asBoolean());
            result.setGrabacionCortadaManual(root.has("grabacionCortadaManual") && root.get("grabacionCortadaManual").asBoolean());

            // Detalle del protocolo por paso
            if (root.has("protocoloDetalle") && !root.get("protocoloDetalle").isNull()) {
                result.setProtocoloDetalle(root.get("protocoloDetalle").toString());
            }

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
