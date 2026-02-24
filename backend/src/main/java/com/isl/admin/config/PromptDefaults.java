package com.isl.admin.config;

public final class PromptDefaults {

    private PromptDefaults() {}

    public static final String DEFAULT_ANALYSIS_PROMPT = """
Vas a analizar una conversación completa entre un agente de Carrefour Banca y un cliente.

Tu tarea es evaluar la interacción en tres dimensiones:

1) EXPERIENCIA DEL CLIENTE
2) ANÁLISIS DE CONTENIDO
3) CALIDAD DEL AGENTE

Devuelve el resultado exclusivamente en formato JSON válido siguiendo EXACTAMENTE la estructura indicada más abajo.

----------------------------------
DIMENSIÓN 1: EXPERIENCIA DEL CLIENTE
----------------------------------

Evalúa:

- Sentimiento inicial del cliente (positivo / neutro / negativo)
- Sentimiento final del cliente (positivo / neutro / negativo)
- Score de sentimiento general (1 a 5 donde 1 = muy negativo y 5 = muy positivo)
- Nivel de frustración (bajo / medio / alto)
- Evidencia de fricción (true/false)
- Tipo de fricción detectada:
    - repetición de información
    - no comprensión del agente
    - tiempos largos
    - falta de solución
    - respuestas genéricas
    - otro
- Indicadores textuales de fricción (citas breves del cliente)
- Probabilidad de recontacto (baja / media / alta)
- Riesgo de abandono o baja (bajo / medio / alto)

----------------------------------
DIMENSIÓN 2: ANÁLISIS DE CONTENIDO
----------------------------------

Identifica:

- Motivo principal de contacto (elige una categoría clara)
- Submotivo (si aplica)
- Categoría general:
    - reclamo
    - consulta
    - gestión operativa
    - fraude
    - mora/deuda
    - baja de producto
    - promoción/beneficios
    - otro

- Nivel de complejidad del caso (bajo / medio / alto)
- Requirió escalamiento (sí / no / incierto)
- Nivel de riesgo legal o reputacional (bajo / medio / alto)
- Presencia de palabras asociadas a:
    - defensa del consumidor
    - denuncia
    - cancelación
    - incumplimiento
    - fraude

- Intención comercial detectada (ninguna / potencial cross-sell / potencial refinanciación / otro)
- Oportunidad comercial desaprovechada (sí / no)

----------------------------------
DIMENSIÓN 3: CALIDAD DEL AGENTE
----------------------------------

Evalúa:

- El agente saluda correctamente (sí / no)
- Se identifica (sí / no)
- Valida identidad cuando corresponde (sí / no / no aplica)
- Muestra empatía (baja / media / alta)
- Claridad en las explicaciones (baja / media / alta)
- Uso excesivo de tecnicismos (sí / no)
- Proactividad (baja / media / alta)
- Ofrece solución concreta (sí / no / parcial)
- Hace cierre formal adecuado (sí / no)
- Score general de calidad del agente (1 a 5)

----------------------------------

Devuelve el resultado en este formato JSON:

{
  "experiencia_cliente": {...},
  "analisis_contenido": {...},
  "calidad_agente": {...}
}

No agregues explicación fuera del JSON.
Analiza la siguiente conversación:
[PEGAR AQUI LA CONVERSACIÓN COMPLETA]
""";
}
