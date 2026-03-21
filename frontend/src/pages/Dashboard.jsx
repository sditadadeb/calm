import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  FileText,
  Headphones,
  MessageCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import MetricCard from '../components/MetricCard';

const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#a78bfa', '#f472b6', '#14b8a6'];
const HEATMAP_HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEK_DAYS = [
  { idx: 1, short: 'Lun', full: 'Lunes' },
  { idx: 2, short: 'Mar', full: 'Martes' },
  { idx: 3, short: 'Mié', full: 'Miércoles' },
  { idx: 4, short: 'Jue', full: 'Jueves' },
  { idx: 5, short: 'Vie', full: 'Viernes' },
  { idx: 6, short: 'Sáb', full: 'Sábado' },
  { idx: 0, short: 'Dom', full: 'Domingo' },
];

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

const isApiKeyPendingLabel = (value) => {
  const n = normalize(value);
  return n.includes('analisis pendiente') && n.includes('api key') && n.includes('no configurada');
};

const REASON_NOISE_TERMS = [
  'saludo',
  'inicio de interaccion',
  'inicios de interaccion',
  'transcripcion insuficiente',
  'transcripción insuficiente',
  'sin contexto',
  'sin informacion',
  'sin información',
  'audio deficiente',
  'no se entiende',
  'inaudible',
];

const OBJECTION_NOISE_TERMS = new Set([
  'no',
  'si',
  'sí',
  'ok',
  'bueno',
  'hola',
  'hola hola',
  'o sea',
  'osea',
  'ah',
  'aja',
  'mm',
  'mmm',
  'eh',
  'em',
  'dale',
  'listo',
  'perfecto',
  'gracias',
  'ninguna',
  'ninguno',
  'n/a',
  'na',
  '-',
]);

const COMMERCIAL_OBJECTION_HINTS = [
  'precio',
  'costo',
  'cuota',
  'interes',
  'interés',
  'tasa',
  'comision',
  'comisión',
  'cargo',
  'deuda',
  'mora',
  'cancel',
  'baja',
  'fraude',
  'beneficio',
  'promocion',
  'promoción',
  'seguro',
  'tarjeta',
  'limite',
  'límite',
  'refinanci',
  'demora',
  'incumplimiento',
  'reclamo',
];

const toTitle = (text) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const classifyBajaType = (rawValue) => {
  const norm = normalize(rawValue);
  if (!norm) return null;
  const hasBajaIntent = ['baja', 'dar de baja', 'cancel', 'cancelacion', 'cancelación'].some((term) => norm.includes(term));
  if (!hasBajaIntent) return null;

  const effectiveHints = [
    'baja efectiva',
    'baja confirmada',
    'baja realizada',
    'ya se dio de baja',
    'se dio de baja',
    'dado de baja',
    'producto dado de baja',
    'cancelado',
    'cancelada',
    'cancelacion efectiva',
    'cancelación efectiva',
  ];
  if (effectiveHints.some((hint) => norm.includes(hint))) return 'Baja efectiva';

  return 'Intención de baja';
};

const cleanCommercialReason = (rawReason) => {
  const raw = (rawReason || '').toString().trim();
  const norm = normalize(raw);
  if (!norm || norm === 'sin clasificar') return null;
  if (isApiKeyPendingLabel(raw)) return null;
  if (REASON_NOISE_TERMS.some((noise) => norm.includes(noise))) return null;

  if (norm.includes('fraude')) return 'Fraude';
  if (norm.includes('mora') || norm.includes('deuda') || norm.includes('cobranz')) return 'Deuda / Mora';
  const bajaType = classifyBajaType(raw);
  if (bajaType) return bajaType;
  if (norm.includes('refinanci')) return 'Refinanciación';
  if (norm.includes('promocion') || norm.includes('beneficio')) return 'Promociones y beneficios';
  if (norm.includes('reclamo')) return 'Reclamo';
  if (norm.includes('consulta')) return 'Consulta';
  if (norm.includes('operativ')) return 'Gestión operativa';

  return toTitle(norm.replace(/\s+/g, ' '));
};

const cleanCommercialObjection = (rawObjection) => {
  const raw = (rawObjection || '').toString().trim();
  const norm = normalize(raw).replace(/[^\w\s]/g, '').trim();
  if (!norm || OBJECTION_NOISE_TERMS.has(norm)) return null;

  // Frases de relleno o continuidad conversacional sin valor comercial.
  if (norm.includes('hola') || norm.includes('o sea') || norm.includes('osea')) return null;

  const wordCount = norm.split(/\s+/).filter(Boolean).length;
  const words = norm.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);

  // Repeticiones tipo "hola hola", "no no", etc.
  if (uniqueWords.size === 1 && words.length > 1) return null;

  // Muy corto + sin señal comercial => ruido.
  const hasCommercialHint = COMMERCIAL_OBJECTION_HINTS.some((hint) => norm.includes(hint));
  if (!hasCommercialHint && (wordCount <= 2 || norm.length < 14)) return null;

  return toTitle(norm.replace(/\s+/g, ' '));
};

const hasAudioIssues = (t) => {
  const text = normalize(t?.transcriptionText);
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
  return keywords.some((k) => text.includes(k)) || Number(t?.analysisConfidence || 100) < 45;
};

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function Dashboard() {
  const { dashboardMetrics, transcriptions, loading, fetchDashboardMetrics, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardMetrics();
    fetchTranscriptions();
  }, [fetchDashboardMetrics, fetchTranscriptions]);

  const analyzedTranscriptions = useMemo(
    () => (transcriptions || []).filter((t) => t?.analyzed === true),
    [transcriptions]
  );

  const businessMetrics = useMemo(() => {
    const total = analyzedTranscriptions.length;
    if (!total) {
      return {
        total,
        opportunityPct: 0,
        missedOpportunityPct: 0,
        audioIssueCount: 0,
        audioIssuePct: 0,
        commercialResolutionPct: 0,
        sentimentAvg: 0,
        topMotivos: [],
        topObjeciones: [],
        priorityList: [],
      };
    }

    let opportunity = 0;
    let missedOpportunity = 0;
    let audioIssues = 0;
    let commercialResolved = 0;
    let sentimentSum = 0;
    let sentimentCount = 0;
    const motivoMap = {};
    const objecionesMap = {};

    const priorityList = analyzedTranscriptions
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
        const opLost = isYes(ac.oportunidad_comercial_desaprovechada || ac['oportunidad comercial desaprovechada']);
        const riskAbandono = normalize(ec.riesgo_abandono_baja || ec['riesgo de abandono o baja']);
        const friccion = ec.evidencia_friccion === true || normalize(ec.evidencia_friccion) === 'true';
        const audio = hasAudioIssues(t);
        const motiveRaw = (ac.motivo_principal_contacto || t.motivoPrincipal || t.noSaleReason || 'Sin clasificar').toString().trim();
        const motive = cleanCommercialReason(motiveRaw) || 'Otro motivo comercial';
        const nextAction = (t.followUpRecommendation || 'Recontactar con propuesta de valor clara').toString();

        if (intent && intent !== 'ninguna') opportunity += 1;
        if (opLost) missedOpportunity += 1;
        if (audio) audioIssues += 1;
        if (t.saleCompleted === true) commercialResolved += 1;

        const scoreSent = Number(ec.score_sentimiento_general);
        if (!Number.isNaN(scoreSent)) {
          sentimentSum += scoreSent;
          sentimentCount += 1;
        }

        if (cleanCommercialReason(motiveRaw)) {
          motivoMap[motive] = (motivoMap[motive] || 0) + 1;
        }
        safeArray(t.customerObjections).forEach((obj) => {
          const cleaned = cleanCommercialObjection(obj);
          if (!cleaned) return;
          const key = normalize(cleaned);
          if (!objecionesMap[key]) {
            objecionesMap[key] = { name: cleaned, value: 0 };
          }
          objecionesMap[key].value += 1;
          if (cleaned.length > objecionesMap[key].name.length) {
            objecionesMap[key].name = cleaned;
          }
        });

        const priorityScore =
          (riskAbandono === 'alto' ? 4 : 0) +
          (opLost ? 3 : 0) +
          (friccion ? 2 : 0) +
          (audio ? 1 : 0) +
          (intent && intent !== 'ninguna' ? 2 : 0);

        return {
          recordingId: t.recordingId,
          recordingDate: t.recordingDate,
          motivo: motive,
          riskAbandono,
          opLost,
          hasOpportunity: intent && intent !== 'ninguna',
          audio,
          priorityScore,
          nextAction,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 12);

    const topMotivos = Object.entries(motivoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const topObjeciones = Object.values(objecionesMap)
      .filter((item) => item.value >= 3)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item) => ({ name: item.name, value: item.value }));

    return {
      total,
      opportunityPct: (opportunity * 100) / total,
      missedOpportunityPct: (missedOpportunity * 100) / total,
      audioIssueCount: audioIssues,
      audioIssuePct: (audioIssues * 100) / total,
      commercialResolutionPct: (commercialResolved * 100) / total,
      sentimentAvg: sentimentCount ? sentimentSum / sentimentCount : 0,
      topMotivos,
      topObjeciones,
      priorityList,
    };
  }, [analyzedTranscriptions]);

  const temporalHeatmap = useMemo(() => {
    const matrix = {};
    WEEK_DAYS.forEach((d) => {
      matrix[d.idx] = {};
      HEATMAP_HOURS.forEach((h) => { matrix[d.idx][h] = 0; });
    });

    const dayTotals = {};
    const hourTotals = {};
    WEEK_DAYS.forEach((d) => { dayTotals[d.idx] = 0; });
    HEATMAP_HOURS.forEach((h) => { hourTotals[h] = 0; });

    analyzedTranscriptions.forEach((t) => {
      if (!t?.recordingDate) return;
      const date = new Date(t.recordingDate);
      if (Number.isNaN(date.getTime())) return;
      const day = date.getDay();
      const hour = date.getHours();
      if (matrix[day] && typeof matrix[day][hour] === 'number') {
        matrix[day][hour] += 1;
        dayTotals[day] += 1;
        hourTotals[hour] += 1;
      }
    });

    const maxCell = Math.max(1, ...WEEK_DAYS.flatMap((d) => HEATMAP_HOURS.map((h) => matrix[d.idx][h])));

    const peakDay = WEEK_DAYS.reduce((best, d) =>
      dayTotals[d.idx] > (best.total ?? -1)
        ? { idx: d.idx, name: d.full, total: dayTotals[d.idx] }
        : best
    , { idx: 1, name: 'Lunes', total: 0 });

    const peakHour = HEATMAP_HOURS.reduce((best, h) =>
      hourTotals[h] > (best.total ?? -1)
        ? { hour: h, total: hourTotals[h] }
        : best
    , { hour: 0, total: 0 });

    return { matrix, maxCell, peakDay, peakHour };
  }, [analyzedTranscriptions]);

  const applyObjectionFilter = (name) => {
    const params = new URLSearchParams();
    params.set('view', 'objection');
    params.set('objection', name);
    navigate(`/transcriptions?${params.toString()}`);
  };

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando tablero comercial...</p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: isDark ? '#fff' : '#374151',
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Radar comercial Carrefour Banco</h2>
            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Vista ejecutiva para ventas, retención y oportunidades de cross-sell.
            </p>
          </div>
          <span className={`text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-700 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            Base analizada: {businessMetrics.total} conversaciones
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid grid-cols-4 gap-6 min-w-[1100px]">
          <Link to="/transcriptions?view=cross-sell" className="block">
            <MetricCard
              title="Oportunidad Cross-Sell"
              value={`${businessMetrics.opportunityPct.toFixed(1)}%`}
              subtitle="Conversaciones con potencial comercial (ver casos)"
              infoText="Porcentaje de conversaciones con intención comercial detectada distinta de 'ninguna'."
              icon={Target}
              variant="success"
            />
          </Link>
          <MetricCard
            title="Calidad de Llamadas"
            value={`${businessMetrics.commercialResolutionPct.toFixed(1)}%`}
            subtitle="Conversaciones con cierre positivo"
            infoText="Porcentaje de conversaciones que terminaron con un cierre positivo o resolución satisfactoria."
            icon={Headphones}
            variant="success"
          />
          <MetricCard
            title="Sentimiento Promedio"
            value={businessMetrics.sentimentAvg.toFixed(2)}
            subtitle="Escala 1 a 5"
            infoText="Promedio del score de sentimiento general."
            icon={MessageCircle}
            variant="success"
          />
          <MetricCard
            title="Oportunidad Perdida"
            value={`${businessMetrics.missedOpportunityPct.toFixed(1)}%`}
            subtitle="Cross-sell no aprovechado"
            infoText="Conversaciones donde se detectó oportunidad comercial desaprovechada."
            icon={TrendingUp}
            variant="warning"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Link to="/transcriptions?view=audio-issues" className="block">
          <div className={`rounded-xl border px-4 py-3 min-w-[240px] hover:border-amber-500/50 transition-colors ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-[11px] uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              Calidad de Audio
            </p>
            <p className="text-xl font-bold text-amber-500 mt-1">{businessMetrics.audioIssueCount}/{businessMetrics.total}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Problemas de audio detectados (ver casos)</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Top 10 razones de llamada</h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Dónde concentrar campañas y scripts comerciales</p>
          {businessMetrics.topMotivos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={businessMetrics.topMotivos}>
                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#9ca3af'} fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis stroke={isDark ? '#94a3b8' : '#9ca3af'} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#004F9F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-52 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Sin datos suficientes</div>
          )}
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Top objeciones del cliente</h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Qué frena la venta y cómo priorizar entrenamiento (clic para ver conversaciones)</p>
          {businessMetrics.topObjeciones.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={260}>
                <PieChart>
                  <Pie
                    data={businessMetrics.topObjeciones}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={3}
                    onClick={(entry) => applyObjectionFilter(entry?.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {businessMetrics.topObjeciones.map((entry, index) => (
                      <Cell
                        key={`obj-${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke={isDark ? '#1f2937' : '#ffffff'}
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {businessMetrics.topObjeciones.map((item, idx) => (
                  <button
                    key={`${item.name}-${idx}`}
                    type="button"
                    onClick={() => applyObjectionFilter(item.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className={`text-sm truncate flex-1 text-left ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>{item.name}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.value}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-52 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Sin objeciones estructuradas todavía</div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#004F9F]" />
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cola de acción comercial priorizada</h3>
          </div>
          <Link
            to="/transcriptions"
            className="text-sm font-semibold text-[#004F9F] hover:text-[#003A79]"
          >
            Ver lista completa
          </Link>
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
          Conversaciones con mayor potencial de recuperación de venta o prevención de fuga.
        </p>
        {businessMetrics.priorityList.length > 0 ? (
          <div className="space-y-2">
            {businessMetrics.priorityList.map((item, index) => (
              <div
                key={`${item.recordingId}-${index}`}
                className={`grid grid-cols-1 lg:grid-cols-5 gap-3 rounded-xl p-3 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="lg:col-span-2">
                  <Link
                    to={`/transcriptions/${item.recordingId}`}
                    className={`font-mono text-sm font-semibold hover:underline ${isDark ? 'text-[#7db7ff]' : 'text-[#004F9F]'}`}
                  >
                    #{item.recordingId}
                  </Link>
                  <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{item.motivo}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{item.nextAction}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  {item.hasOpportunity && <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Cross-sell</span>}
                  {item.opLost && <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">Desaprovechada</span>}
                  {item.riskAbandono === 'alto' && <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">Fuga alta</span>}
                  {item.audio && <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">Audio</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`h-24 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Sin prioridades por el momento</div>
        )}
      </div>

      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Recomendaciones para vender más y retener</h3>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Esta sección ahora está en una pestaña dedicada para mejor seguimiento comercial.
            </p>
          </div>
          <Link
            to="/sales-recommendations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            Abrir pestaña
          </Link>
        </div>
      </div>

      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Heatmap de atenciones por día y hora</h3>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Identifica cuándo se concentra la demanda para ajustar staffing y campañas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <span className="text-xs uppercase tracking-wide opacity-70">Día pico</span>
              <p className="font-semibold">{temporalHeatmap.peakDay.name} ({temporalHeatmap.peakDay.total})</p>
            </div>
            <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <span className="text-xs uppercase tracking-wide opacity-70">Hora pico</span>
              <p className="font-semibold">{String(temporalHeatmap.peakHour.hour).padStart(2, '0')}:00 ({temporalHeatmap.peakHour.total})</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="flex mb-2">
              <div className="w-12" />
              {HEATMAP_HOURS.map((h) => (
                <div key={`hh-${h}`} className={`w-8 text-center text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  {h}
                </div>
              ))}
            </div>

            {WEEK_DAYS.map((d) => (
              <div key={`row-${d.idx}`} className="flex items-center mb-1">
                <div className={`w-12 text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{d.short}</div>
                {HEATMAP_HOURS.map((h) => {
                  const value = temporalHeatmap.matrix[d.idx]?.[h] || 0;
                  const intensity = value / temporalHeatmap.maxCell;
                  return (
                    <div
                      key={`cell-${d.idx}-${h}`}
                      className="w-8 h-6 rounded-sm mx-[1px]"
                      style={{
                        backgroundColor: value === 0
                          ? (isDark ? '#111827' : '#f3f4f6')
                          : `rgba(0, 79, 159, ${0.20 + intensity * 0.80})`,
                      }}
                      title={`${d.full} ${String(h).padStart(2, '0')}:00 → ${value} atenciones`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
