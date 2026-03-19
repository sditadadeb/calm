import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
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

export default function SalesRecommendations() {
  const { transcriptions, loading, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchTranscriptions();
  }, [fetchTranscriptions]);

  const recommendations = useMemo(() => {
    const analyzed = (transcriptions || []).filter((t) => t?.analyzed === true);
    const priority = analyzed
      .map((t) => {
        let payload = {};
        try {
          payload = t.analysisPayload ? JSON.parse(t.analysisPayload) : {};
        } catch (_) {
          payload = {};
        }

        const ec = payload?.experiencia_cliente || {};
        const ac = payload?.analisis_contenido || {};

        const intent = normalize(ac.intencion_comercial_detectada || ac['intención comercial detectada']);
        const missedOpportunity = isYes(ac.oportunidad_comercial_desaprovechada || ac['oportunidad comercial desaprovechada']);
        const highChurnRisk = normalize(ec.riesgo_abandono_baja || ec['riesgo de abandono o baja']) === 'alto';
        const friction = ec.evidencia_friccion === true || normalize(ec.evidencia_friccion) === 'true';
        const audioIssue = hasAudioIssues(t);
        const motivo = cleanReason(ac.motivo_principal_contacto || t.motivoPrincipal || t.noSaleReason);

        const priorityScore =
          (highChurnRisk ? 4 : 0) +
          (missedOpportunity ? 3 : 0) +
          (friction ? 2 : 0) +
          (audioIssue ? 1 : 0) +
          (intent && intent !== 'ninguna' ? 2 : 0);

        return {
          recordingId: t.recordingId,
          motivo,
          saleCompleted: t.saleCompleted === true,
          hasOpportunity: Boolean(intent && intent !== 'ninguna'),
          missedOpportunity,
          highChurnRisk,
          friction,
          audioIssue,
          priorityScore,
        };
      })
      .filter((item) => item.priorityScore > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 20);

    return priority.map((item) => {
      const whatWentWrong = item.missedOpportunity
        ? 'Se detectó oportunidad comercial, pero no se aprovechó en la conversación.'
        : item.highChurnRisk
          ? 'La conversación muestra riesgo alto de baja y no tuvo contención suficiente.'
          : item.audioIssue
            ? 'La calidad de audio afectó la claridad de la atención.'
            : item.friction
              ? 'Hubo fricción durante la atención que impactó en el cierre.'
              : 'La gestión no cerró de forma efectiva.';

      const whatToDo = item.missedOpportunity
        ? 'Recontactar con propuesta concreta y cierre guiado en 1-2 pasos.'
        : item.highChurnRisk
          ? 'Aplicar protocolo de retención con beneficio puntual y seguimiento dentro de 24h.'
          : item.audioIssue
            ? 'Repetir contacto por canal alternativo o nueva llamada con validación de audio al inicio.'
            : item.friction
              ? 'Usar guion de empatía + resumen de solución para reducir fricción.'
              : 'Refuerzo de técnica de cierre y manejo de objeciones.';

      return { ...item, whatWentWrong, whatToDo };
    });
  }, [transcriptions]);

  const stats = useMemo(() => {
    const total = recommendations.length;
    const high = recommendations.filter((r) => r.highChurnRisk).length;
    const missed = recommendations.filter((r) => r.missedOpportunity).length;
    return { total, high, missed };
  }, [recommendations]);

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
          Casos priorizados con acciones concretas para recuperar oportunidades y evitar bajas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Casos recomendados</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Riesgo alto de baja</p>
          <p className="text-2xl font-bold mt-1 text-red-400">{stats.high}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Oportunidad desaprovechada</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{stats.missed}</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={`${rec.recordingId}-${idx}`}
                className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}
              >
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
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                      Qué se hizo mal
                    </p>
                    <p className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>{rec.whatWentWrong}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-green-950/30 border border-green-900/40' : 'bg-green-50 border border-green-100'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      Qué se debería hacer
                    </p>
                    <p className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>{rec.whatToDo}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {rec.hasOpportunity && <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Cross-sell</span>}
                  {rec.missedOpportunity && <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">Desaprovechada</span>}
                  {rec.highChurnRisk && <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">Fuga alta</span>}
                  {rec.audioIssue && <span className="px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-200">Audio</span>}
                  {rec.friction && <span className="px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-200">Fricción</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`h-24 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            Sin casos priorizados para recomendar.
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
            Esta pestaña se alimenta de conversaciones analizadas y prioriza retención + oportunidad comercial.
          </p>
        </div>
      </div>
    </div>
  );
}

