package com.calm.admin.service;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de reparación JSON contra la implementación real de ChatGPTAnalyzerService.
 */
class ChatGPTAnalyzerServiceJsonRepairTest {

    private ObjectMapper mapper;
    private Method parseRepairedJson;

    @BeforeEach
    void setUp() throws Exception {
        mapper = new ObjectMapper();
        mapper.configure(JsonParser.Feature.ALLOW_TRAILING_COMMA, true);
        mapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);

        parseRepairedJson = ChatGPTAnalyzerService.class.getDeclaredMethod(
                "parseRepairedJson", String.class, ObjectMapper.class);
        parseRepairedJson.setAccessible(true);
    }

    private JsonNode parse(String json) throws Exception {
        ChatGPTAnalyzerService service = new ChatGPTAnalyzerService(mapper, null);
        return (JsonNode) parseRepairedJson.invoke(service, json, mapper);
    }

    @Test
    void periodInsteadOfCommaAfterBoolean() throws Exception {
        JsonNode root = parse("""
        {
          "confidenceTrace": {
            "signals": {
              "wordCount": 13,
              "turnCount": 2,
              "dialogueDetectable": true. "explicitCloseSignal": false
            },
            "weights": {
              "textIntegrity": 0.5. "conversationalCoherence": 0.35
            }
          },
          "saleCompleted": false,
          "saleStatus": "UNINTERPRETABLE",
          "analysisConfidence": 28
        }
        """);
        assertFalse(root.get("saleCompleted").asBoolean());
        assertTrue(root.get("confidenceTrace").get("signals").get("dialogueDetectable").asBoolean());
        assertFalse(root.get("confidenceTrace").get("signals").get("explicitCloseSignal").asBoolean());
        assertEquals(0.5, root.get("confidenceTrace").get("weights").get("textIntegrity").asDouble(), 0.001);
    }

    @Test
    void leadingDecimalWithoutZero() throws Exception {
        JsonNode root = parse("""
        { "weights": { "textIntegrity": .5, "conversationalCoherence": .35 } }
        """);
        assertEquals(0.5, root.get("weights").get("textIntegrity").asDouble(), 0.001);
        assertEquals(0.35, root.get("weights").get("conversationalCoherence").asDouble(), 0.001);
    }

    @Test
    void shortUninterpretableTranscriptionShape() throws Exception {
        JsonNode root = parse("""
        {
          "saleCompleted": false,
          "saleStatus": "UNINTERPRETABLE",
          "analysisConfidence": 28,
          "confidenceTrace": {
            "methodVersion": "confidence_v4_2026-02",
            "subscores": { "textIntegrity": 35, "conversationalCoherence": 25, "analyticsUsability": 10 },
            "weights": { "textIntegrity": 0.5, "conversationalCoherence": 0.35, "analyticsUsability": 0.15 },
            "signals": { "wordCount": 13, "turnCount": 2, "dialogueDetectable": true }
          },
          "executiveSummary": "Interacción muy breve.",
          "noSaleReason": "Transcripción no interpretable"
        }
        """);
        assertEquals("UNINTERPRETABLE", root.get("saleStatus").asText());
        assertEquals(13, root.get("confidenceTrace").get("signals").get("wordCount").asInt());
    }
}
