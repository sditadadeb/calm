package com.calm.admin.service;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test de reparación de JSON malformado que GPT-5.1 genera.
 * Reproduce los patrones reales de error observados en producción.
 */
public class JsonRepairTest {

    private final ObjectMapper mapper;

    public JsonRepairTest() {
        mapper = new ObjectMapper();
        mapper.configure(JsonParser.Feature.ALLOW_TRAILING_COMMA, true);
        mapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
        mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
    }

    // ======= Métodos de repair copiados de ChatGPTAnalyzerService =======

    private String extractJsonBlock(String response) {
        String json = response;
        if (json.contains("```json")) {
            json = json.substring(json.indexOf("```json") + 7);
            int endIdx = json.indexOf("```");
            if (endIdx > 0) json = json.substring(0, endIdx);
        } else if (json.contains("```")) {
            json = json.substring(json.indexOf("```") + 3);
            int endIdx = json.indexOf("```");
            if (endIdx > 0) json = json.substring(0, endIdx);
        }
        json = json.trim();
        int firstBrace = json.indexOf('{');
        if (firstBrace > 0) {
            json = json.substring(firstBrace);
        }
        int lastBrace = json.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < json.length() - 1) {
            json = json.substring(0, lastBrace + 1);
        }
        return json;
    }

    private String insertMissingCommas(String json) {
        StringBuilder result = new StringBuilder(json.length() + 100);
        int i = 0;
        int len = json.length();
        boolean afterValue = false;
        
        while (i < len) {
            char c = json.charAt(i);
            
            if (Character.isWhitespace(c)) {
                result.append(c);
                i++;
                continue;
            }
            
            if (afterValue && c != ',' && c != ':' && c != '}' && c != ']') {
                result.append(',');
            }
            
            afterValue = false;
            
            if (c == '"') {
                result.append(c);
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
                afterValue = true;
            } else if (c == '{' || c == '[') {
                result.append(c);
                i++;
                afterValue = false;
            } else if (c == '}' || c == ']') {
                result.append(c);
                i++;
                afterValue = true;
            } else if (c == ',') {
                result.append(c);
                i++;
                afterValue = false;
            } else if (c == ':') {
                result.append(c);
                i++;
                afterValue = false;
            } else if (c == 't' || c == 'f' || c == 'n') {
                int start = i;
                while (i < len && Character.isLetter(json.charAt(i))) i++;
                result.append(json, start, i);
                afterValue = true;
            } else if (c == '-' || Character.isDigit(c)) {
                int start = i;
                if (c == '-') i++;
                while (i < len && (Character.isDigit(json.charAt(i)) || json.charAt(i) == '.'
                        || json.charAt(i) == 'e' || json.charAt(i) == 'E'
                        || json.charAt(i) == '+' || json.charAt(i) == '-')) {
                    i++;
                }
                result.append(json, start, i);
                afterValue = true;
            } else {
                result.append(c);
                i++;
            }
        }
        return result.toString();
    }

    private String repairJson(String json) {
        json = json.replace('\u201C', '"').replace('\u201D', '"');
        json = json.replace('\u2018', '\'').replace('\u2019', '\'');
        json = json.replace('\u2013', '-').replace('\u2014', '-');
        json = json.replace('\u00A0', ' ');
        if (json.startsWith("\uFEFF")) json = json.substring(1);
        json = json.replace("\r\n", "\n").replace("\r", "\n");

        json = json.replaceAll(":\\s*True\\b", ": true");
        json = json.replaceAll(":\\s*False\\b", ": false");
        json = json.replaceAll(":\\s*None\\b", ": null");

        json = json.replaceAll(",\\s*}", "}");
        json = json.replaceAll(",\\s*]", "]");

        json = insertMissingCommas(json);

        long openBraces = json.chars().filter(c -> c == '{').count();
        long closeBraces = json.chars().filter(c -> c == '}').count();
        long openBrackets = json.chars().filter(c -> c == '[').count();
        long closeBrackets = json.chars().filter(c -> c == ']').count();
        while (openBrackets > closeBrackets) { json = json + "]"; closeBrackets++; }
        while (openBraces > closeBraces) { json = json + "}"; closeBraces++; }
        return json;
    }

    private JsonNode fullParse(String raw) throws Exception {
        String json = extractJsonBlock(raw);
        json = repairJson(json);
        return mapper.readTree(json.trim());
    }

    // ======= TESTS =======

    @Test
    void testValidJson() throws Exception {
        String json = """
        {
          "saleCompleted": true,
          "saleStatus": "SALE_CONFIRMED",
          "analysisConfidence": 73,
          "sellerScore": 8
        }
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals(73, root.get("analysisConfidence").asInt());
    }

    @Test
    void testMissingCommaAfterBoolean_newline() throws Exception {
        String json = """
        {
          "dialogueDetectable": true
          "explicitCloseSignal": true
        }
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("dialogueDetectable").asBoolean());
        assertTrue(root.get("explicitCloseSignal").asBoolean());
    }

    @Test
    void testMissingCommaAfterBoolean_sameLine() throws Exception {
        String json = """
        { "dialogueDetectable": true "explicitCloseSignal": false }
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("dialogueDetectable").asBoolean());
        assertFalse(root.get("explicitCloseSignal").asBoolean());
    }

    @Test
    void testMissingCommaAfterNumber_decimal() throws Exception {
        String json = """
        {
          "textIntegrity": 0.50
          "conversationalCoherence": 0.35
          "analyticsUsability": 0.15
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals(0.50, root.get("textIntegrity").asDouble(), 0.01);
        assertEquals(0.35, root.get("conversationalCoherence").asDouble(), 0.01);
        assertEquals(0.15, root.get("analyticsUsability").asDouble(), 0.01);
    }

    @Test
    void testMissingCommaAfterClosingBrace() throws Exception {
        String json = """
        {
          "confidenceTrace": {
            "methodVersion": "v4"
          }
          "saleEvidence": "lo llevo"
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals("v4", root.get("confidenceTrace").get("methodVersion").asText());
        assertEquals("lo llevo", root.get("saleEvidence").asText());
    }

    @Test
    void testMissingCommaAfterClosingBracket() throws Exception {
        String json = """
        {
          "productsDiscussed": ["colchón", "almohada"]
          "customerObjections": ["precio alto"]
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals(2, root.get("productsDiscussed").size());
        assertEquals(1, root.get("customerObjections").size());
    }

    @Test
    void testMissingCommaAfterString() throws Exception {
        String json = """
        {
          "saleStatus": "SALE_CONFIRMED"
          "saleEvidence": "lo llevo"
          "noSaleReason": null
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals("lo llevo", root.get("saleEvidence").asText());
    }

    @Test
    void testMissingCommaInsideArray() throws Exception {
        String json = """
        {
          "closeSignalsDetected": ["pago con tarjeta" "horario de entrega" "dirección"]
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals(3, root.get("closeSignalsDetected").size());
        assertEquals("pago con tarjeta", root.get("closeSignalsDetected").get(0).asText());
        assertEquals("horario de entrega", root.get("closeSignalsDetected").get(1).asText());
        assertEquals("dirección", root.get("closeSignalsDetected").get(2).asText());
    }

    @Test
    void testTrailingComma() throws Exception {
        String json = """
        {
          "saleCompleted": true,
          "saleStatus": "SALE_CONFIRMED",
        }
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("saleCompleted").asBoolean());
    }

    @Test
    void testPythonBooleans() throws Exception {
        String json = """
        {
          "saleCompleted": True,
          "dialogueDetectable": False,
          "noSaleReason": None
        }
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertFalse(root.get("dialogueDetectable").asBoolean());
        assertTrue(root.get("noSaleReason").isNull());
    }

    @Test
    void testSmartQuotes() throws Exception {
        String json = "{\u201CsaleCompleted\u201D: true, \u201CsaleStatus\u201D: \u201CSALE_CONFIRMED\u201D}";
        JsonNode root = fullParse(json);
        assertTrue(root.get("saleCompleted").asBoolean());
    }

    @Test 
    void testMarkdownCodeBlock() throws Exception {
        String json = """
        Here is the analysis:
        ```json
        {
          "saleCompleted": true,
          "saleStatus": "SALE_CONFIRMED"
        }
        ```
        """;
        JsonNode root = fullParse(json);
        assertTrue(root.get("saleCompleted").asBoolean());
    }

    /**
     * Test que simula la estructura COMPLETA del JSON del prompt v4,
     * con CERO comas (el peor caso absoluto de GPT-5.1).
     */
    @Test
    void testFullV4Response_zeroCommas() throws Exception {
        System.out.println("=== Test: FULL v4 response with ZERO commas ===");
        String json = """
        {
          "saleCompleted": true
          "saleStatus": "SALE_CONFIRMED"
          "analysisConfidence": 73
          "confidenceTrace": {
            "methodVersion": "confidence_v4_2026-02"
            "subscores": {
              "textIntegrity": 70
              "conversationalCoherence": 75
              "analyticsUsability": 80
            }
            "weights": {
              "textIntegrity": 0.50
              "conversationalCoherence": 0.35
              "analyticsUsability": 0.15
            }
            "signals": {
              "wordCount": 650
              "turnCount": 30
              "dialogueDetectable": true
              "explicitCloseSignal": true
            }
            "flags": []
            "rationale": "El texto tiene buena calidad con errores menores de ASR."
          }
          "saleEvidence": "Cliente dice: lo llevo, paso la tarjeta"
          "saleEvidenceMeta": {
            "closeSignalStrength": 95
            "closeSignalsDetected": ["pago con tarjeta" "dirección de entrega"]
            "evidenceType": "PAYMENT"
            "evidenceQuote": "paso la tarjeta, me lo llevo"
          }
          "noSaleReason": null
          "productsDiscussed": ["Colchón Queen" "Almohada viscoelástica"]
          "customerObjections": ["precio alto"]
          "improvementSuggestions": ["Ofrecer financiación desde el inicio"]
          "executiveSummary": "El cliente buscaba un colchón queen size. El vendedor ofreció varias opciones y el cliente decidió llevarlo."
          "sellerScore": 8
          "sellerStrengths": ["Buena escucha activa" "Presentación clara de productos"]
          "sellerWeaknesses": ["No ofreció productos complementarios"]
          "followUpRecommendation": null
        }
        """;
        JsonNode root = fullParse(json);

        // Verificar todos los campos principales
        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals(73, root.get("analysisConfidence").asInt());

        // confidenceTrace
        JsonNode ct = root.get("confidenceTrace");
        assertNotNull(ct);
        assertEquals("confidence_v4_2026-02", ct.get("methodVersion").asText());
        assertEquals(70, ct.get("subscores").get("textIntegrity").asInt());
        assertEquals(0.50, ct.get("weights").get("textIntegrity").asDouble(), 0.01);
        assertTrue(ct.get("signals").get("dialogueDetectable").asBoolean());
        assertTrue(ct.get("signals").get("explicitCloseSignal").asBoolean());
        assertEquals(650, ct.get("signals").get("wordCount").asInt());

        // saleEvidenceMeta
        JsonNode sem = root.get("saleEvidenceMeta");
        assertNotNull(sem);
        assertEquals(95, sem.get("closeSignalStrength").asInt());
        assertEquals(2, sem.get("closeSignalsDetected").size());
        assertEquals("pago con tarjeta", sem.get("closeSignalsDetected").get(0).asText());
        assertEquals("dirección de entrega", sem.get("closeSignalsDetected").get(1).asText());
        assertEquals("PAYMENT", sem.get("evidenceType").asText());

        // Arrays
        assertEquals(2, root.get("productsDiscussed").size());
        assertEquals(1, root.get("customerObjections").size());
        assertEquals(1, root.get("improvementSuggestions").size());
        assertEquals(2, root.get("sellerStrengths").size());
        assertEquals(1, root.get("sellerWeaknesses").size());

        // Scalars
        assertEquals(8, root.get("sellerScore").asInt());
        assertTrue(root.get("noSaleReason").isNull());
        assertTrue(root.get("followUpRecommendation").isNull());

        System.out.println("  ALL FIELDS PARSED CORRECTLY!");
    }

    /**
     * Test con mezcla de comas presentes y faltantes (caso real).
     */
    @Test
    void testMixedCommasPresenceAndAbsence() throws Exception {
        System.out.println("=== Test: mixed commas (some present, some missing) ===");
        String json = """
        {
          "saleCompleted": false,
          "saleStatus": "NO_SALE",
          "analysisConfidence": 45
          "confidenceTrace": {
            "methodVersion": "confidence_v4_2026-02",
            "subscores": {
              "textIntegrity": 40,
              "conversationalCoherence": 50
              "analyticsUsability": 45
            },
            "weights": {
              "textIntegrity": 0.50,
              "conversationalCoherence": 0.35,
              "analyticsUsability": 0.15
            },
            "signals": {
              "wordCount": 200,
              "turnCount": 20,
              "dialogueDetectable": true
              "explicitCloseSignal": false
            },
            "flags": [],
            "rationale": "Texto con ruido moderado de ASR."
          },
          "saleEvidence": "Sin evidencia de venta"
          "noSaleReason": "Comparando opciones"
          "productsDiscussed": ["Colchón 2 plazas"],
          "customerObjections": []
          "improvementSuggestions": [],
          "executiveSummary": "El cliente consultó por un colchón de 2 plazas pero dijo que iba a seguir comparando."
          "sellerScore": 6,
          "sellerStrengths": ["Amabilidad"],
          "sellerWeaknesses": ["No intentó cerrar la venta"]
          "followUpRecommendation": "Hacer seguimiento por WhatsApp en 48hs"
        }
        """;
        JsonNode root = fullParse(json);
        assertFalse(root.get("saleCompleted").asBoolean());
        assertEquals("NO_SALE", root.get("saleStatus").asText());
        assertEquals("Comparando opciones", root.get("noSaleReason").asText());
        assertEquals(6, root.get("sellerScore").asInt());
        assertEquals("Hacer seguimiento por WhatsApp en 48hs", root.get("followUpRecommendation").asText());
        System.out.println("  ALL FIELDS PARSED CORRECTLY!");
    }

    /**
     * Test con strings que contienen comillas escapadas (edge case).
     */
    @Test
    void testStringsWithEscapedQuotes() throws Exception {
        String json = """
        {
          "saleEvidence": "Cliente dijo: \\"lo llevo\\""
          "executiveSummary": "El vendedor respondió: \\"perfecto\\""
        }
        """;
        JsonNode root = fullParse(json);
        assertEquals("Cliente dijo: \"lo llevo\"", root.get("saleEvidence").asText());
        assertEquals("El vendedor respondió: \"perfecto\"", root.get("executiveSummary").asText());
    }
}
