package com.calm.admin.controller;

import com.calm.admin.dto.PromptConfigDTO;
import com.calm.admin.model.SystemConfig;
import com.calm.admin.repository.SystemConfigRepository;
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

═══════════════════════════════════════════════════════════════════
⚠️ IMPORTANTE FINAL
═══════════════════════════════════════════════════════════════════

Prioriza confiabilidad, explicabilidad y usabilidad
por sobre completitud o métricas optimistas.
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

