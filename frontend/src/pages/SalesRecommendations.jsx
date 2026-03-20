import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Heart } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';

const normalize = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replaceAll('á', 'a')
    .replaceAll('é', 'e')
    .replaceAll('í', 'i')
    .replaceAll('ó', 'o')
    .replaceAll('ú', 'u')
    .trim();

const isYes = (value) => ['si', 'sí', 'true', 'yes'].includes(normalize(value));
const isNo = (value) => ['no', 'false'].includes(normalize(value));

const hasAudioIssues = (transcription) => {
  const text = normalize(transcription?.transcriptionText);
  if (!text) return false;
  const keywords = [
    'no se escucha',
    'no te escucho',
    'te escucho cortado',
    'se corta',
    'con interferencia',
    'mala señal',
    'se entrecorta',
    'ruido',
    'sin audio',
    'microfono',
  ];
  return keywords.some((k) => text.includes(k)) || Number(transcription?.analysisConfidence || 100) < 45;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === 0) return value;
    if (typeof value === 'boolean') return value;
    if (value !== null && value !== undefined && `${value}`.trim() !== '') return value;
  }
  return null;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const cleanReason = (rawReason) => {
  const norm = normalize(rawReason);
  if (!norm) return 'Sin clasificar';
  if (norm.includes('fraude')) return 'Fraude';
  if (norm.includes('mora') || norm.includes('deuda') || norm.includes('cobranz')) return 'Deuda / Mora';
  if (norm.includes('baja') || norm.includes('cancel')) return 'Baja / Cancelación';
  if (norm.includes('refinanci')) return 'Refinanciación';
  if (norm.includes('promocion') || norm.includes('beneficio')) return 'Promociones y beneficios';
  if (norm.includes('reclamo')) return 'Reclamo';
  if (norm.includes('consulta')) return 'Consulta';
  if (norm.includes('operativ')) return 'Gestión operativa';
  return rawReason || 'Sin clasificar';
};

const getPayloadBlock = (payload, key) => payload?.[key] || {};

const buildActionPlan = (signal) => {
  const commercialProblems = [];
  const commercialActions = [];
  const cxProblems = [];
  const cxActions = [];

  if (signal.missedOpportunity) {
    commercialProblems.push('Oportunidad comercial detectada pero no se concretó una propuesta.');
    commercialActions.push('Recontactar con oferta puntual y cierre en 2 pasos (beneficio + confirmación).');
  }
  if (signal.highChurnRisk) {
    commercialProblems.push('Riesgo alto de baja sin contención suficiente.');
    commercialActions.push('Aplicar protocolo de retención con opción alternativa y seguimiento en 24h.');
  }
  if (!signal.solutionOffered) {
    commercialProblems.push('No quedó registrada una solución concreta.');
    commercialActions.push('Definir acción resolutiva con responsable y plazo.');
  }
  if (signal.friction) {
    commercialProblems.push(`Fricción detectada${signal.frictionType ? ` (${signal.frictionType})` : ''}.`);
    commercialActions.push('Resumir problema entendido + acción + validar entendimiento antes de avanzar.');
  }

  if (signal.lowEmpathy || signal.lowClarity) {
    cxProblems.push('El tono o la claridad del agente no ayudaron a bajar la tensión del cliente.');
    cxActions.push('Usar lenguaje simple, validar entendimiento cada 1-2 pasos y mostrar empatía genuina.');
  }
  if (signal.frustrationHigh) {
    cxProblems.push('El cliente terminó con frustración alta.');
    cxActions.push('Reconocer la molestia explícitamente y acordar próximo paso con plazo exacto.');
  }
  if (signal.sentimentWorsened) {
    cxProblems.push('El sentimiento del cliente empeoró durante la llamada.');
    cxActions.push('Cerrar con recap de solución y pregunta: "¿Te resolví lo que necesitabas hoy?"');
  }
  if (!signal.protocolOk) {
    cxProblems.push('Faltó protocolo completo (saludo / identificación / cierre).');
    cxActions.push('Reforzar estructura base de apertura y cierre empático.');
  }
  if (signal.audioIssue) {
    cxProblems.push('Calidad de audio degradó la comprensión y confianza.');
    cxActions.push('Pedir disculpas por el canal y confirmar que el cliente comprendió todo.');
  }
  if (signal.recontactHigh) {
    cxProblems.push('Alta probabilidad de que el cliente vuelva a llamar por lo mismo.');
    cxActions.push('Informar estado actual + próximo hito + cómo contactarse si persiste.');
  }

  if (commercialProblems.length === 0) commercialProblems.push('Sin fallas comerciales críticas; hay espacio para optimización.');
  if (commercialActions.length === 0) commercialActions.push('Mantener enfoque actual y estandarizar la práctica.');
  if (cxProblems.length === 0) cxProblems.push('Sin problemas graves de experiencia detectados.');
  if (cxActions.length === 0) cxActions.push('Cerrar siempre con validación de satisfacción y canal de seguimiento.');

  return {
    commercialProblem: commercialProblems[0],
    commercialAction: commercialActions[0],
    commercialAllProblems: commercialProblems,
    commercialAllActions: commercialActions,
    cxProblem: cxProblems[0],
    cxAction: cxActions[0],
    cxAllProblems: cxProblems,
    cxAllActions: cxActions,
  };
};

export default function SalesRecommendations() {
  const { transcriptions, loading, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('comercial');

  useEffect(() => {
    fetchTranscriptions();
  }, [fetchTranscriptions]);

  const analyzedCases = useMemo(() => {
    const analyzed = (transcriptions || []).filter((t) => t?.analyzed === true);
    return analyzed
      .map((t, idx) => {
        let payload = {};
        try {
          payload = t.analysisPayload ? JSON.parse(t.analysisPayload) : {};
        } catch (_) {
          payload = {};
        }

        const ec = getPayloadBlock(payload, 'experiencia_cliente');
        const ac = getPayloadBlock(payload, 'analisis_contenido');
        const qa = getPayloadBlock(payload, 'calidad_agente');

        const intent = normalize(firstNonEmpty(ac.intencion_comercial_detectada, ac['intención comercial detectada']));
        const missedOpportunity = isYes(firstNonEmpty(ac.oportunidad_comercial_desaprovechada, ac['oportunidad comercial desaprovechada']));
        const churnRisk = normalize(firstNonEmpty(ec.riesgo_abandono_baja, ec['riesgo de abandono o baja']));
        const highChurnRisk = churnRisk === 'alto';
        const friction = ec.evidencia_friccion === true || normalize(ec.evidencia_friccion) === 'true';
        const frictionType = firstNonEmpty(ec.tipo_friccion_detectada, ec['tipo de fricción detectada']) || null;
        const recontactProb = normalize(firstNonEmpty(ec.probabilidad_recontacto, ec['probabilidad de recontacto']));
        const sentimentInitial = normalize(firstNonEmpty(ec.sentimiento_inicial_cliente, ec['sentimiento inicial del cliente']));
        const sentimentFinal = normalize(firstNonEmpty(ec.sentimiento_final_cliente, ec['sentimiento final del cliente']));
        const frustration = normalize(firstNonEmpty(ec.nivel_frustracion, ec['nivel de frustración']));
        const legalRisk = normalize(firstNonEmpty(ac.nivel_riesgo_legal_reputacional, ac['nivel de riesgo legal o reputacional']));
        const escalated = normalize(firstNonEmpty(ac.requirio_escalamiento, ac['requirió escalamiento']));

        const empathy = normalize(firstNonEmpty(qa.muestra_empatia, qa['muestra empatía']));
        const clarity = normalize(firstNonEmpty(qa.claridad_explicaciones, qa['claridad en las explicaciones']));
        const solutionOffered = !isNo(firstNonEmpty(qa.ofrece_solucion_concreta, qa['ofrece solución concreta'], qa.ofrece_solucion, qa['ofrece solución']));
        const greeted = isYes(firstNonEmpty(qa.agente_saluda_correctamente, qa['el agente saluda correctamente'], qa.saluda));
        const identified = isYes(firstNonEmpty(qa.se_identifica, qa['se identifica']));
        const formalClose = isYes(firstNonEmpty(qa.hace_cierre_formal_adecuado, qa['hace cierre formal adecuado'], qa.cierre_formal));
        const protocolOk = greeted && identified && formalClose;

        const audioIssue = hasAudioIssues(t);
        const motivo = cleanReason(ac.motivo_principal_contacto || t.motivoPrincipal || t.noSaleReason);
        const evidence = firstNonEmpty(
          toArray(ec.indicadores_textuales_friccion)[0],
          t.saleEvidence,
          t.evidenciaResultado,
          t.followUpRecommendation
        );

        const lowEmpathy = empathy === 'baja';
        const lowClarity = clarity === 'baja';
        const needsHappierFlow =
          sentimentFinal === 'negativo' ||
          frustration === 'alto' ||
          recontactProb === 'alta' ||
          !t.saleCompleted;

        const priorityScore =
          (highChurnRisk ? 4 : 0) +
          (missedOpportunity ? 3 : 0) +
          (friction ? 2 : 0) +
          (audioIssue ? 1 : 0) +
          (intent && intent !== 'ninguna' ? 2 : 0) +
          (!solutionOffered ? 2 : 0) +
          (needsHappierFlow ? 2 : 0);

        const consistencyWarnings = [];
        if (Number(t.analysisConfidence || 0) < 55) consistencyWarnings.push('Confianza de análisis baja.');
        if (t.saleCompleted === true && !solutionOffered) consistencyWarnings.push('Figura como resuelto, pero no hay solución concreta.');
        if (t.saleCompleted === true && sentimentFinal === 'negativo') consistencyWarnings.push('Figura como resuelto, pero el sentimiento final quedó negativo.');
        if (t.saleCompleted === false && sentimentFinal === 'positivo') consistencyWarnings.push('No resuelto con sentimiento final positivo; revisar contexto.');
        if (friction && !toArray(ec.indicadores_textuales_friccion).length) consistencyWarnings.push('Fricción marcada sin evidencia textual clara.');
        if (legalRisk === 'alto' && !escalated.includes('si')) consistencyWarnings.push('Riesgo legal alto sin escalamiento explícito.');

        const requiresReview = consistencyWarnings.length > 0;
        const confidenceBand = Number(t.analysisConfidence || 0) >= 75 ? 'alta' : Number(t.analysisConfidence || 0) >= 55 ? 'media' : 'baja';

        const actionPlan = buildActionPlan({
          missedOpportunity,
          highChurnRisk,
          friction,
          frictionType,
          audioIssue,
          solutionOffered,
          protocolOk,
          lowEmpathy,
          lowClarity,
          frustrationHigh: frustration === 'alto',
          sentimentWorsened: sentimentInitial !== 'negativo' && sentimentFinal === 'negativo',
          recontactHigh: recontactProb === 'alta',
        });

        return {
          idx,
          recordingId: t.recordingId,
          motivo,
          saleCompleted: t.saleCompleted === true,
          hasOpportunity: Boolean(intent && intent !== 'ninguna'),
          missedOpportunity,
          highChurnRisk,
          friction,
          audioIssue,
          needsHappierFlow,
          recontactProb,
          sentimentInitial,
          sentimentFinal,
          frustration,
          legalRisk,
          escalated,
          confidenceBand,
          analysisConfidence: Number(t.analysisConfidence || 0),
          requiresReview,
          consistencyWarnings,
          evidence,
          protocolOk,
          lowEmpathy,
          lowClarity,
          solutionOffered,
          priorityScore,
          ...actionPlan,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [transcriptions]);

  const stats = useMemo(() => {
    const total = analyzedCases.length;
    const high = analyzedCases.filter((r) => r.highChurnRisk).length;
    const missed = analyzedCases.filter((r) => r.missedOpportunity).length;
    const unhappy = analyzedCases.filter((r) => r.needsHappierFlow).length;
    return { total, high, missed, unhappy };
  }, [analyzedCases]);

  const tabs = useMemo(() => ([
    {
      id: 'comercial',
      label: 'Recuperación comercial',
      icon: Lightbulb,
      count: analyzedCases.filter((c) =>
        c.analysisConfidence >= 55 &&
        (
          c.missedOpportunity ||
          (c.hasOpportunity && !c.saleCompleted) ||
          (c.highChurnRisk && c.hasOpportunity) ||
          !c.solutionOffered
        )
      ).length
    },
    {
      id: 'feliz',
      label: 'Cliente más feliz',
      icon: Heart,
      count: analyzedCases.filter((c) =>
        c.analysisConfidence >= 55 &&
        (
          c.frustration === 'alto' ||
          c.sentimentFinal === 'negativo' ||
          c.recontactProb === 'alta' ||
          c.lowEmpathy ||
          c.lowClarity ||
          !c.protocolOk
        )
      ).length
    },
  ]), [analyzedCases]);

  const filteredCases = useMemo(() => {
    const sortByPriority = (arr) =>
      [...arr].sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return b.analysisConfidence - a.analysisConfidence;
      });

    if (activeTab === 'comercial') {
      return sortByPriority(
        analyzedCases.filter((c) =>
          c.analysisConfidence >= 55 &&
          (
            c.missedOpportunity ||
            (c.hasOpportunity && !c.saleCompleted) ||
            (c.highChurnRisk && c.hasOpportunity) ||
            !c.solutionOffered
          )
        )
      ).slice(0, 15);
    }

    if (activeTab === 'feliz') {
      return sortByPriority(
        analyzedCases.filter((c) =>
          c.analysisConfidence >= 55 &&
          (
            c.frustration === 'alto' ||
            c.sentimentFinal === 'negativo' ||
            c.recontactProb === 'alta' ||
            c.lowEmpathy ||
            c.lowClarity ||
            !c.protocolOk
          )
        )
      ).slice(0, 15);
    }

    return sortByPriority(analyzedCases).slice(0, 15);
  }, [activeTab, analyzedCases]);

  const getCardCopy = (rec) => {
    if (activeTab === 'feliz') {
      return {
        leftTitle: 'Qué afectó la experiencia',
        leftItems: rec.cxAllProblems || [rec.cxProblem],
        rightTitle: 'Cómo lograr que se vaya más feliz',
        rightItems: rec.cxAllActions || [rec.cxAction],
      };
    }
    return {
      leftTitle: 'Qué falló comercialmente',
      leftItems: rec.commercialAllProblems || [rec.commercialProblem],
      rightTitle: 'Acción recomendada',
      rightItems: rec.commercialAllActions || [rec.commercialAction],
    };
  };

  if (loading && (!transcriptions || transcriptions.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Recomendaciones para vender más y retener</h2>
          <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
          Casos accionables basados en señales reales de contenido, experiencia y calidad del agente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Conversaciones analizadas</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Riesgo alto de baja</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>{stats.high}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Oportunidades desaprovechadas</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>{stats.missed}</p>
        </div>
      </div>

      <div className={`rounded-xl border p-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  active
                    ? (isDark ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-gray-900 text-white border-gray-900')
                    : isDark
                      ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        {filteredCases.length > 0 ? (
          <div className="space-y-3">
            {filteredCases.map((rec, idx) => (
              <div
                key={`${rec.recordingId}-${idx}`}
                className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}
              >
                {(() => {
                  const copy = getCardCopy(rec);
                  return (
                    <>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <Link
                      to={`/transcriptions/${rec.recordingId}`}
                      className={`font-mono font-semibold hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                    >
                      #{rec.recordingId}
                    </Link>
                    <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{rec.motivo}</p>
                  </div>
                  <Link
                    to={`/transcriptions/${rec.recordingId}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-500 hover:text-emerald-400"
                  >
                    Ir a conversación <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-red-950/30 border border-red-900/40' : 'bg-red-50 border border-red-100'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                      {copy.leftTitle}
                    </p>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
                      {copy.leftItems.map((item, i) => (
                        <li key={`${rec.recordingId}-l-${i}`} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-green-950/30 border border-green-900/40' : 'bg-green-50 border border-green-100'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      {copy.rightTitle}
                    </p>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
                      {copy.rightItems.map((item, i) => (
                        <li key={`${rec.recordingId}-r-${i}`} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-green-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {rec.evidence && (
                  <div className={`rounded-lg p-3 mt-3 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                      Evidencia detectada
                    </p>
                    <p className={`text-sm italic ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>"{rec.evidence}"</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeTab === 'comercial' && rec.hasOpportunity && <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-200">Cross-sell</span>}
                  {activeTab === 'comercial' && rec.missedOpportunity && <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">Desaprovechada</span>}
                  {activeTab === 'comercial' && rec.highChurnRisk && <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">Riesgo fuga</span>}
                  {activeTab === 'comercial' && rec.friction && <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-200">Fricción</span>}

                  {activeTab === 'feliz' && rec.frustration === 'alto' && <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">Frustración alta</span>}
                  {activeTab === 'feliz' && rec.sentimentFinal === 'negativo' && <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300">Sentimiento negativo</span>}
                  {activeTab === 'feliz' && rec.recontactProb === 'alta' && <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">Recontacto alto</span>}
                  {activeTab === 'feliz' && rec.lowEmpathy && <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-200">Empatía baja</span>}
                  {activeTab === 'feliz' && !rec.protocolOk && <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-200">Protocolo incompleto</span>}

                  <span className={`px-2 py-1 rounded-full text-xs ${rec.confidenceBand === 'alta' ? 'bg-green-500/20 text-green-300' : rec.confidenceBand === 'media' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                    Confianza {rec.confidenceBand} ({rec.analysisConfidence}%)
                  </span>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className={`h-24 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            Sin casos para esta pestaña.
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
            La priorización combina riesgo de baja, fricción, oportunidad desaprovechada, calidad del agente y consistencia del diagnóstico.
          </p>
        </div>
      </div>
    </div>
  );
}

