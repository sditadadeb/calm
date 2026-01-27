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

