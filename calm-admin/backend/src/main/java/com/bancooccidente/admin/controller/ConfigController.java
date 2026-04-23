package com.bancooccidente.admin.controller;

import com.bancooccidente.admin.dto.PromptConfigDTO;
import com.bancooccidente.admin.model.SystemConfig;
import com.bancooccidente.admin.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    private final SystemConfigRepository configRepository;

    @Value("${openai.model}")
    private String defaultModel;

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

Clasifica cada interacción en UNO solo de los siguientes estados:

🟢 SALE_CONFIRMED — Producto o servicio bancario confirmado con evidencia textual explícita.
🟡 SALE_LIKELY — Alta probabilidad, pero SIN confirmación explícita.
🟠 ADVANCE_NO_CLOSE — Avance sin cierre (cliente solicitará más info, volverá, etc.).
🔴 NO_SALE — No hubo producto ofrecido ni avance comercial relevante.
⚫ UNINTERPRETABLE — La transcripción no permite análisis confiable.

═══════════════════════════════════════════════════════════════════
🏦 TIPIFICACIÓN — MOTIVO DE VISITA (motivoVisita)
═══════════════════════════════════════════════════════════════════

Clasifica el motivo principal de la visita en UNA categoría:
"Apertura de cuenta" | "Consulta de productos" | "Solicitud de crédito / préstamo" |
"Pago / transferencia" | "Reclamo / queja" | "Cancelación de producto" |
"Actualización de datos" | "Inversiones / CDT" | "Tarjeta de crédito / débito" |
"Otro" | "No determinado"

═══════════════════════════════════════════════════════════════════
😊 ESTADO EMOCIONAL DEL CLIENTE (estadoEmocional)
═══════════════════════════════════════════════════════════════════

"Positivo" — satisfecho, tranquilo, receptivo.
"Neutro" — sin señales claras de satisfacción ni molestia.
"Negativo" — molesto, frustrado o insatisfecho.
"No determinado" — sin evidencia suficiente.

═══════════════════════════════════════════════════════════════════
⭐ CSAT — SATISFACCIÓN DEL CLIENTE (csatScore)
═══════════════════════════════════════════════════════════════════

Escala 1–5: 5=Muy satisfecho, 4=Satisfecho, 3=Neutro, 2=Insatisfecho, 1=Muy insatisfecho.
Usar 0 si no hay evidencia suficiente.

═══════════════════════════════════════════════════════════════════
👂 ESCUCHA ACTIVA DEL OFICIAL (escuchaActivaScore)
═══════════════════════════════════════════════════════════════════

Escala 1–10: 10=Escucha perfecta, parafrasea, valida. 1=No escucha, interrumpe.

═══════════════════════════════════════════════════════════════════
📋 CUMPLIMIENTO DE PROTOCOLO (cumplimientoProtocolo, protocoloScore)
═══════════════════════════════════════════════════════════════════

cumplimientoProtocolo: true si hay evidencia de seguimiento del flujo (saludo, identificación, resolución, despedida).
protocoloScore: 0–100. Qué tan bien se siguió el protocolo de atención bancaria.

═══════════════════════════════════════════════════════════════════
💰 EFECTIVIDAD COMERCIAL
═══════════════════════════════════════════════════════════════════

productoOfrecido: true si el oficial ofreció activamente algún producto o servicio bancario.
montoOfrecido: número en pesos colombianos si se mencionó monto de crédito/préstamo. null si no aplica.
cumplimientoLineamiento: true si el monto ofrecido es igual o superior al lineamiento del banco. null si no aplica.

═══════════════════════════════════════════════════════════════════
🎙️ GRABACIÓN Y CONSENTIMIENTO
═══════════════════════════════════════════════════════════════════

grabacionCortadaCliente: true si hay evidencia de que el cliente solicitó no ser grabado.
grabacionCortadaManual: true si hay evidencia de que el oficial finalizó la grabación manualmente.

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
📊 CÁLCULO DE analysisConfidence (0–100)
═══════════════════════════════════════════════════════════════════

Mide SOLO la calidad del INPUT, independiente de si hubo venta o no.

analysisConfidence = ROUND(textIntegrity*0.50 + conversationalCoherence*0.35 + analyticsUsability*0.15)

Si saleStatus=UNINTERPRETABLE → analysisConfidence <= 35.
Si wordCount<40 o turnCount<4 → analyticsUsability <= 40.

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
    "subscores": { "textIntegrity": 0-100, "conversationalCoherence": 0-100, "analyticsUsability": 0-100 },
    "weights": { "textIntegrity": 0.50, "conversationalCoherence": 0.35, "analyticsUsability": 0.15 },
    "signals": { "wordCount": 0, "turnCount": 0, "dialogueDetectable": true/false, "explicitCloseSignal": true/false },
    "flags": [],
    "rationale": "1-2 frases sobre calidad del input. NO resumir la conversación."
  },
  "saleEvidence": "Cita textual exacta o 'Sin evidencia de venta'",
  "saleEvidenceMeta": {
    "closeSignalStrength": 0-100,
    "closeSignalsDetected": [],
    "evidenceType": "PAYMENT" | "DELIVERY" | "INVOICE" | "DATA_CAPTURE" | "EXPLICIT_COMMITMENT" | "NONE",
    "evidenceQuote": ""
  },
  "noSaleReason": "string descriptivo o null",
  "productsDiscussed": [],
  "customerObjections": [],
  "improvementSuggestions": [],
  "executiveSummary": "Resumen factual 2-3 oraciones: qué consultó el cliente, qué ofreció el oficial, qué se resolvió.",
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
2) Si saleStatus = SALE_CONFIRMED: saleEvidence debe ser cita textual exacta, evidenceType != NONE.
3) Si saleStatus != SALE_CONFIRMED: saleEvidence = "Sin evidencia de venta", closeSignalStrength = 0.
4) No strings vacíos en arrays: usar [] si no hay evidencia.

Prioriza confiabilidad, explicabilidad y usabilidad por sobre completitud.
Si no hay evidencia, dilo y deja arrays vacíos.
""";

    public ConfigController(SystemConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @GetMapping("/prompt")
    public ResponseEntity<PromptConfigDTO> getPromptConfig() {
        String prompt = configRepository.findByConfigKey(PROMPT_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(DEFAULT_PROMPT);

        String model = configRepository.findByConfigKey(MODEL_KEY)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultModel);

        Double temperature = configRepository.findByConfigKey(TEMPERATURE_KEY)
                .map(c -> Double.parseDouble(c.getConfigValue()))
                .orElse(0.3);

        Integer maxTokens = configRepository.findByConfigKey(MAX_TOKENS_KEY)
                .map(c -> Integer.parseInt(c.getConfigValue()))
                .orElse(2000);

        return ResponseEntity.ok(new PromptConfigDTO(prompt, model, temperature, maxTokens));
    }

    @PutMapping("/prompt")
    public ResponseEntity<PromptConfigDTO> updatePromptConfig(@RequestBody PromptConfigDTO config) {
        // Save prompt
        SystemConfig promptConfig = configRepository.findByConfigKey(PROMPT_KEY)
                .orElse(new SystemConfig(PROMPT_KEY, "", "System prompt for ChatGPT analysis"));
        promptConfig.setConfigValue(config.getSystemPrompt());
        configRepository.save(promptConfig);

        // Save model
        if (config.getModel() != null) {
            SystemConfig modelConfig = configRepository.findByConfigKey(MODEL_KEY)
                    .orElse(new SystemConfig(MODEL_KEY, "", "OpenAI model to use"));
            modelConfig.setConfigValue(config.getModel());
            configRepository.save(modelConfig);
        }

        // Save temperature
        if (config.getTemperature() != null) {
            SystemConfig tempConfig = configRepository.findByConfigKey(TEMPERATURE_KEY)
                    .orElse(new SystemConfig(TEMPERATURE_KEY, "", "Temperature for response randomness"));
            tempConfig.setConfigValue(String.valueOf(config.getTemperature()));
            configRepository.save(tempConfig);
        }

        // Save max tokens
        if (config.getMaxTokens() != null) {
            SystemConfig tokensConfig = configRepository.findByConfigKey(MAX_TOKENS_KEY)
                    .orElse(new SystemConfig(MAX_TOKENS_KEY, "", "Maximum tokens in response"));
            tokensConfig.setConfigValue(String.valueOf(config.getMaxTokens()));
            configRepository.save(tokensConfig);
        }

        return ResponseEntity.ok(config);
    }

    @PostMapping("/prompt/reset")
    public ResponseEntity<PromptConfigDTO> resetPromptConfig() {
        SystemConfig promptConfig = configRepository.findByConfigKey(PROMPT_KEY)
                .orElse(new SystemConfig(PROMPT_KEY, "", "System prompt for ChatGPT analysis"));
        promptConfig.setConfigValue(DEFAULT_PROMPT);
        configRepository.save(promptConfig);

        return getPromptConfig();
    }
}

