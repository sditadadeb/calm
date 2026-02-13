package com.calm.admin.service;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.Deque;

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
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
    }

    // ======= Métodos copiados de ChatGPTAnalyzerService =======

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
        if (firstBrace > 0) json = json.substring(firstBrace);
        int lastBrace = json.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < json.length() - 1) json = json.substring(0, lastBrace + 1);
        return json;
    }

    // State machine constants
    private static final int ST_INITIAL = 0;
    private static final int ST_EXPECT_KEY = 1;
    private static final int ST_EXPECT_COLON = 2;
    private static final int ST_EXPECT_VALUE = 3;
    private static final int ST_AFTER_VALUE = 4;

    private String insertMissingCommas(String json) {
        StringBuilder result = new StringBuilder(json.length() + 100);
        Deque<Character> stack = new ArrayDeque<>();
        int i = 0;
        int len = json.length();
        int state = ST_INITIAL;

        while (i < len) {
            char c = json.charAt(i);
            if (Character.isWhitespace(c)) { result.append(c); i++; continue; }

            switch (state) {
                case ST_INITIAL:
                    if (c == '{') { result.append(c); i++; stack.push('{'); state = ST_EXPECT_KEY; }
                    else if (c == '[') { result.append(c); i++; stack.push('['); state = ST_EXPECT_VALUE; }
                    else { result.append(c); i++; }
                    break;

                case ST_EXPECT_KEY:
                    if (c == '"') { i = readString(json, i, len, result); state = ST_EXPECT_COLON; }
                    else if (c == '}') { result.append(c); i++; if (!stack.isEmpty()) stack.pop(); state = ST_AFTER_VALUE; }
                    else if (Character.isLetter(c) || c == '_') {
                        int start = i;
                        while (i < len && (Character.isLetterOrDigit(json.charAt(i)) || json.charAt(i) == '_')) i++;
                        result.append('"').append(json, start, i).append('"');
                        state = ST_EXPECT_COLON;
                    } else { result.append(c); i++; }
                    break;

                case ST_EXPECT_COLON:
                    if (c == ':') { result.append(c); i++; state = ST_EXPECT_VALUE; }
                    else { result.append(':'); state = ST_EXPECT_VALUE; /* don't consume c */ }
                    break;

                case ST_EXPECT_VALUE:
                    if (c == '"') { i = readString(json, i, len, result); state = ST_AFTER_VALUE; }
                    else if (c == '{') { result.append(c); i++; stack.push('{'); state = ST_EXPECT_KEY; }
                    else if (c == '[') { result.append(c); i++; stack.push('['); state = ST_EXPECT_VALUE; }
                    else if (c == ']') { result.append(c); i++; if (!stack.isEmpty()) stack.pop(); state = ST_AFTER_VALUE; }
                    else if (c == '}') { result.append(c); i++; if (!stack.isEmpty()) stack.pop(); state = ST_AFTER_VALUE; }
                    else if (c == 't' || c == 'f' || c == 'n') {
                        int start = i; while (i < len && Character.isLetter(json.charAt(i))) i++;
                        result.append(json, start, i); state = ST_AFTER_VALUE;
                    } else if (c == '-' || Character.isDigit(c)) {
                        int start = i; if (c == '-') i++;
                        while (i < len && (Character.isDigit(json.charAt(i)) || json.charAt(i) == '.' || json.charAt(i) == 'e' || json.charAt(i) == 'E' || json.charAt(i) == '+' || json.charAt(i) == '-')) i++;
                        result.append(json, start, i); state = ST_AFTER_VALUE;
                    } else { result.append(c); i++; }
                    break;

                case ST_AFTER_VALUE:
                    if (c == ',') {
                        result.append(c); i++;
                        state = (!stack.isEmpty() && stack.peek() == '{') ? ST_EXPECT_KEY : ST_EXPECT_VALUE;
                    } else if (c == '}') { result.append(c); i++; if (!stack.isEmpty()) stack.pop(); state = ST_AFTER_VALUE; }
                    else if (c == ']') { result.append(c); i++; if (!stack.isEmpty()) stack.pop(); state = ST_AFTER_VALUE; }
                    else {
                        result.append(',');
                        state = (!stack.isEmpty() && stack.peek() == '{') ? ST_EXPECT_KEY : ST_EXPECT_VALUE;
                    }
                    break;
            }
        }
        return result.toString();
    }

    private int readString(String json, int i, int len, StringBuilder result) {
        result.append(json.charAt(i)); i++;
        while (i < len) {
            char sc = json.charAt(i); result.append(sc); i++;
            if (sc == '\\' && i < len) { result.append(json.charAt(i)); i++; }
            else if (sc == '"') break;
        }
        return i;
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
        while (openBrackets > closeBrackets) { json += "]"; closeBrackets++; }
        while (openBraces > closeBraces) { json += "}"; closeBraces++; }
        return json;
    }

    private JsonNode fullParse(String raw) throws Exception {
        String json = extractJsonBlock(raw);
        json = repairJson(json);
        return mapper.readTree(json.trim());
    }

    // ======= TESTS =======

    @Test void testValidJson() throws Exception {
        JsonNode root = fullParse("""
        { "saleCompleted": true, "saleStatus": "SALE_CONFIRMED", "analysisConfidence": 73 }
        """);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
    }

    @Test void testMissingCommaAfterBoolean() throws Exception {
        JsonNode root = fullParse("""
        { "dialogueDetectable": true "explicitCloseSignal": true }
        """);
        assertTrue(root.get("dialogueDetectable").asBoolean());
        assertTrue(root.get("explicitCloseSignal").asBoolean());
    }

    @Test void testMissingCommaAfterDecimal() throws Exception {
        JsonNode root = fullParse("""
        { "textIntegrity": 0.50 "conversationalCoherence": 0.35 "analyticsUsability": 0.15 }
        """);
        assertEquals(0.50, root.get("textIntegrity").asDouble(), 0.01);
        assertEquals(0.35, root.get("conversationalCoherence").asDouble(), 0.01);
    }

    @Test void testMissingCommaAfterBrace() throws Exception {
        JsonNode root = fullParse("""
        { "trace": { "v": "v4" } "evidence": "lo llevo" }
        """);
        assertEquals("v4", root.get("trace").get("v").asText());
        assertEquals("lo llevo", root.get("evidence").asText());
    }

    @Test void testMissingCommaAfterBracket() throws Exception {
        JsonNode root = fullParse("""
        { "products": ["colchón"] "objections": ["precio"] }
        """);
        assertEquals(1, root.get("products").size());
        assertEquals(1, root.get("objections").size());
    }

    @Test void testMissingCommaInsideArray() throws Exception {
        JsonNode root = fullParse("""
        { "items": ["pago con tarjeta" "horario de entrega" "dirección"] }
        """);
        assertEquals(3, root.get("items").size());
        assertEquals("pago con tarjeta", root.get("items").get(0).asText());
        assertEquals("dirección", root.get("items").get(2).asText());
    }

    @Test void testTrailingComma() throws Exception {
        JsonNode root = fullParse("""
        { "saleCompleted": true, "saleStatus": "SALE_CONFIRMED", }
        """);
        assertTrue(root.get("saleCompleted").asBoolean());
    }

    @Test void testPythonBooleans() throws Exception {
        JsonNode root = fullParse("""
        { "saleCompleted": True, "active": False, "reason": None }
        """);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertFalse(root.get("active").asBoolean());
        assertTrue(root.get("reason").isNull());
    }

    @Test void testSmartQuotes() throws Exception {
        JsonNode root = fullParse("{\u201CsaleCompleted\u201D: true}");
        assertTrue(root.get("saleCompleted").asBoolean());
    }

    @Test void testMarkdownCodeBlock() throws Exception {
        JsonNode root = fullParse("```json\n{\"ok\": true}\n```");
        assertTrue(root.get("ok").asBoolean());
    }

    @Test void testEscapedQuotes() throws Exception {
        JsonNode root = fullParse("""
        { "evidence": "dijo: \\"lo llevo\\"" "summary": "ok" }
        """);
        assertEquals("dijo: \"lo llevo\"", root.get("evidence").asText());
    }

    // ===== NUEVOS: Colon faltante y keys sin comillas =====

    @Test void testMissingColon() throws Exception {
        System.out.println("=== Test: missing colon between key and value ===");
        JsonNode root = fullParse("""
        { "explicitCloseSignal" true "dialogueDetectable" false }
        """);
        assertTrue(root.get("explicitCloseSignal").asBoolean());
        assertFalse(root.get("dialogueDetectable").asBoolean());
        System.out.println("  MISSING COLON REPAIRED!");
    }

    @Test void testMissingColonWithStringValue() throws Exception {
        System.out.println("=== Test: missing colon with string value ===");
        JsonNode root = fullParse("""
        { "saleStatus" "SALE_CONFIRMED" "saleEvidence" "lo llevo" }
        """);
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals("lo llevo", root.get("saleEvidence").asText());
        System.out.println("  MISSING COLON (STRING) REPAIRED!");
    }

    @Test void testMissingColonWithNumber() throws Exception {
        System.out.println("=== Test: missing colon with number value ===");
        JsonNode root = fullParse("""
        { "sellerScore" 8 "analysisConfidence" 73 }
        """);
        assertEquals(8, root.get("sellerScore").asInt());
        assertEquals(73, root.get("analysisConfidence").asInt());
        System.out.println("  MISSING COLON (NUMBER) REPAIRED!");
    }

    @Test void testUnquotedKeys() throws Exception {
        System.out.println("=== Test: unquoted field names ===");
        JsonNode root = fullParse("""
        { saleCompleted: true, saleStatus: "SALE_CONFIRMED", analysisConfidence: 73 }
        """);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        System.out.println("  UNQUOTED KEYS REPAIRED!");
    }

    @Test void testMixedMissingColonsAndCommas() throws Exception {
        System.out.println("=== Test: mixed missing colons AND commas ===");
        JsonNode root = fullParse("""
        {
          "saleCompleted" true
          "saleStatus": "SALE_CONFIRMED"
          "analysisConfidence" 73
          "signals": {
            "wordCount" 230
            "turnCount" 16
            "dialogueDetectable" true
            "explicitCloseSignal" true
          }
          "sellerScore" 8
        }
        """);
        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals(73, root.get("analysisConfidence").asInt());
        assertEquals(230, root.get("signals").get("wordCount").asInt());
        assertTrue(root.get("signals").get("explicitCloseSignal").asBoolean());
        assertEquals(8, root.get("sellerScore").asInt());
        System.out.println("  MIXED REPAIRS DONE!");
    }

    /**
     * Test FULL v4 con CERO comas y CERO colons (peor caso absoluto)
     */
    @Test void testFullV4_zeroCommasZeroColons() throws Exception {
        System.out.println("=== Test: FULL v4 - ZERO commas AND ZERO colons ===");
        String json = """
        {
          "saleCompleted" true
          "saleStatus" "SALE_CONFIRMED"
          "analysisConfidence" 73
          "confidenceTrace" {
            "methodVersion" "confidence_v4_2026-02"
            "subscores" {
              "textIntegrity" 70
              "conversationalCoherence" 75
              "analyticsUsability" 80
            }
            "weights" {
              "textIntegrity" 0.50
              "conversationalCoherence" 0.35
              "analyticsUsability" 0.15
            }
            "signals" {
              "wordCount" 650
              "turnCount" 30
              "dialogueDetectable" true
              "explicitCloseSignal" true
            }
            "flags" []
            "rationale" "Buen texto."
          }
          "saleEvidence" "paso la tarjeta"
          "saleEvidenceMeta" {
            "closeSignalStrength" 95
            "closeSignalsDetected" ["pago" "entrega"]
            "evidenceType" "PAYMENT"
            "evidenceQuote" "paso la tarjeta"
          }
          "noSaleReason" null
          "productsDiscussed" ["Colchón" "Almohada"]
          "customerObjections" ["precio"]
          "improvementSuggestions" ["Financiación"]
          "executiveSummary" "Se llevó el colchón."
          "sellerScore" 8
          "sellerStrengths" ["Buena atención" "Claridad"]
          "sellerWeaknesses" ["No ofreció extras"]
          "followUpRecommendation" null
        }
        """;
        JsonNode root = fullParse(json);

        assertTrue(root.get("saleCompleted").asBoolean());
        assertEquals("SALE_CONFIRMED", root.get("saleStatus").asText());
        assertEquals(73, root.get("analysisConfidence").asInt());
        assertEquals("confidence_v4_2026-02", root.get("confidenceTrace").get("methodVersion").asText());
        assertEquals(70, root.get("confidenceTrace").get("subscores").get("textIntegrity").asInt());
        assertEquals(0.50, root.get("confidenceTrace").get("weights").get("textIntegrity").asDouble(), 0.01);
        assertTrue(root.get("confidenceTrace").get("signals").get("explicitCloseSignal").asBoolean());
        assertEquals("PAYMENT", root.get("saleEvidenceMeta").get("evidenceType").asText());
        assertEquals(2, root.get("saleEvidenceMeta").get("closeSignalsDetected").size());
        assertEquals(2, root.get("productsDiscussed").size());
        assertEquals(8, root.get("sellerScore").asInt());
        assertTrue(root.get("noSaleReason").isNull());

        System.out.println("  FULL V4 ZERO COMMAS + ZERO COLONS PARSED!");
    }

    /**
     * Test con mezcla realista (algunas comas/colons presentes, otras no)
     */
    @Test void testRealisticMixed() throws Exception {
        System.out.println("=== Test: realistic mixed ===");
        String json = """
        {
          "saleCompleted": false,
          "saleStatus": "NO_SALE",
          "analysisConfidence" 45
          "confidenceTrace": {
            "methodVersion": "confidence_v4_2026-02",
            "subscores": {
              "textIntegrity": 40,
              "conversationalCoherence" 50
              "analyticsUsability": 45
            },
            "signals": {
              "wordCount": 200,
              "turnCount": 20,
              "dialogueDetectable" true
              "explicitCloseSignal" false
            },
            "flags": [],
            "rationale": "Texto con ruido."
          },
          "saleEvidence" "Sin evidencia de venta"
          "noSaleReason" "Comparando opciones"
          "productsDiscussed": ["Colchón 2 plazas"],
          "customerObjections": []
          "improvementSuggestions": [],
          "executiveSummary" "Consultó pero no compró."
          "sellerScore": 6,
          "sellerStrengths": ["Amabilidad"],
          "sellerWeaknesses" ["No cerró"]
          "followUpRecommendation" "WhatsApp en 48hs"
        }
        """;
        JsonNode root = fullParse(json);
        assertFalse(root.get("saleCompleted").asBoolean());
        assertEquals("NO_SALE", root.get("saleStatus").asText());
        assertEquals("Comparando opciones", root.get("noSaleReason").asText());
        assertEquals(6, root.get("sellerScore").asInt());
        assertEquals("WhatsApp en 48hs", root.get("followUpRecommendation").asText());
        System.out.println("  REALISTIC MIXED PARSED!");
    }
}
