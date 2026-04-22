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

