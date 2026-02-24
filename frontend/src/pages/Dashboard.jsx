import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Award,
  Users,
  Building2,
  ArrowRight,
  Clock,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import MetricCard from '../components/MetricCard';

// Colores Carrefour
const COLORS = ['#004F9F', '#003A79', '#E30613', '#6b7280', '#d1d5db'];

// Días de la semana
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Colores para sucursales en scatter plot
const BRANCH_COLORS = ['#004F9F', '#22c55e', '#3b82f6', '#E30613', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const { dashboardMetrics, transcriptions, loading, fetchDashboardMetrics, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();

  useEffect(() => {
    // Siempre cargar datos al entrar al Dashboard
    fetchDashboardMetrics();
    fetchTranscriptions();
  }, [fetchDashboardMetrics, fetchTranscriptions]);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!dashboardMetrics) {
    return (
      <div className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100'}`}>
          <FileText className="w-8 h-8 text-[#004F9F]" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Sin datos disponibles</h3>
        <p className={isDark ? 'text-zinc-400' : 'text-gray-500'}>Sincroniza desde S3 para comenzar</p>
      </div>
    );
  }

  const { 
    totalTranscriptions, 
    totalSales, 
    totalNoSales, 
    conversionRate,
    averageSellerScore,
    sellerMetrics,
    branchMetrics,
    noSaleReasons,
    cxMetrics
  } = dashboardMetrics;

  const computedCxMetrics = useMemo(() => {
    const analyzed = (transcriptions || []).filter((t) => t?.analysisPayload);
    if (analyzed.length === 0) return null;

    const norm = (v) => (v || '').toString().toLowerCase()
      .replaceAll('á', 'a')
      .replaceAll('é', 'e')
      .replaceAll('í', 'i')
      .replaceAll('ó', 'o')
      .replaceAll('ú', 'u')
      .trim();

    let sentimentSum = 0;
    let sentimentCount = 0;
    let frictionCount = 0;
    let abandonoAltoCount = 0;
    let qualitySum = 0;
    let qualityCount = 0;
    let protocoloOkCount = 0;
    let escalamientoYesCount = 0;
    let legalMidHighCount = 0;
    let cxRiskSum = 0;
    const topMotivos = {};

    analyzed.forEach((t) => {
      try {
        const payload = JSON.parse(t.analysisPayload);
        const ec = payload?.experiencia_cliente || {};
        const ac = payload?.analisis_contenido || {};
        const qa = payload?.calidad_agente || {};

        const scoreSent = Number(ec.score_sentimiento_general);
        if (!Number.isNaN(scoreSent)) {
          sentimentSum += scoreSent;
          sentimentCount += 1;
        }

        if (ec.evidencia_friccion === true || norm(ec.evidencia_friccion) === 'true') {
          frictionCount += 1;
        }
        const abandono = norm(ec.riesgo_abandono_baja || ec['riesgo de abandono o baja']);
        if (abandono === 'alto') abandonoAltoCount += 1;

        const scoreCalidad = Number(qa.score_general_calidad_agente);
        if (!Number.isNaN(scoreCalidad)) {
          qualitySum += scoreCalidad;
          qualityCount += 1;
        }

        const saluda = ['si', 'sí'].includes(norm(qa.agente_saluda_correctamente || qa['el agente saluda correctamente']));
        const identifica = ['si', 'sí'].includes(norm(qa.se_identifica || qa['se identifica']));
        const cierre = ['si', 'sí'].includes(norm(qa.hace_cierre_formal_adecuado || qa['hace cierre formal adecuado']));
        if (saluda && identifica && cierre) protocoloOkCount += 1;

        const escalamiento = norm(ac.requirio_escalamiento || ac['requirió escalamiento']);
        if (['si', 'sí'].includes(escalamiento)) escalamientoYesCount += 1;

        const riesgoLegal = norm(ac.riesgo_legal_reputacional || ac['nivel de riesgo legal o reputacional']);
        if (['medio', 'alto'].includes(riesgoLegal)) legalMidHighCount += 1;

        const motivo = (ac.motivo_principal_contacto || t.motivoPrincipal || 'Sin clasificar').toString().trim();
        topMotivos[motivo] = (topMotivos[motivo] || 0) + 1;

        const fin = norm(ec.sentimiento_final_cliente);
        const cxRisk = (ec.evidencia_friccion ? 2 : 0)
          + (abandono === 'alto' ? 3 : 0)
          + (['medio', 'alto'].includes(riesgoLegal) ? 3 : 0)
          + (fin === 'negativo' ? 2 : 0);
        cxRiskSum += cxRisk;
      } catch (_) {
        // Ignorar payloads inválidos
      }
    });

    const total = analyzed.length || 1;
    const topMotivosSorted = Object.fromEntries(
      Object.entries(topMotivos).sort((a, b) => b[1] - a[1]).slice(0, 10)
    );

    return {
      averageSentimentScore: sentimentCount ? sentimentSum / sentimentCount : 0,
      frictionIndex: (frictionCount * 100) / total,
      abandonmentRiskHighPct: (abandonoAltoCount * 100) / total,
      averageAgentQualityScore: qualityCount ? qualitySum / qualityCount : 0,
      protocolCompliancePct: (protocoloOkCount * 100) / total,
      escalationRate: (escalamientoYesCount * 100) / total,
      legalRiskIndex: (legalMidHighCount * 100) / total,
      cxRiskScoreAvg: cxRiskSum / total,
      topMotivosContacto: topMotivosSorted,
    };
  }, [transcriptions]);

  const effectiveCxMetrics = cxMetrics || computedCxMetrics || {};
  const sentimentAvg = effectiveCxMetrics.averageSentimentScore ?? 0;
  const frictionIndex = effectiveCxMetrics.frictionIndex ?? 0;
  const abandonmentRiskHighPct = effectiveCxMetrics.abandonmentRiskHighPct ?? 0;
  const agentQualityAvg = effectiveCxMetrics.averageAgentQualityScore ?? averageSellerScore ?? 0;
  const cxRiskScoreAvg = effectiveCxMetrics.cxRiskScoreAvg ?? 0;
  const protocolCompliancePct = effectiveCxMetrics.protocolCompliancePct ?? 0;
  const escalationRate = effectiveCxMetrics.escalationRate ?? 0;
  const legalRiskIndex = effectiveCxMetrics.legalRiskIndex ?? 0;

  const sellerChartData = sellerMetrics?.slice(0, 5).map(s => ({
    name: s.userName?.split(' ')[0] || 'N/A',
    resuelto: s.sales,
    noResuelto: s.noSales,
  })) || [];

  const noSaleReasonsData = effectiveCxMetrics?.topMotivosContacto
    ? Object.entries(effectiveCxMetrics.topMotivosContacto).map(([name, value]) => ({ name, value }))
    : noSaleReasons
      ? Object.entries(noSaleReasons).map(([name, value]) => ({ name, value }))
    : [];

  // Procesar datos para Heatmap semanal (días vs horas)
  const heatmapData = (() => {
    const matrix = {};
    // Inicializar matriz 7 días x 24 horas
    for (let day = 0; day < 7; day++) {
      matrix[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        matrix[day][hour] = 0;
      }
    }
    // Contar transcripciones (solo si hay datos)
    if (transcriptions && transcriptions.length > 0) {
      transcriptions.forEach(t => {
        if (t.recordingDate) {
          const date = new Date(t.recordingDate);
          const day = date.getDay(); // 0-6
          const hour = date.getHours(); // 0-23
          matrix[day][hour]++;
        }
      });
    }
    return matrix;
  })();

  // Obtener el máximo para escala de colores del heatmap
  const maxHeatmapValue = Math.max(
    1,
    ...Object.values(heatmapData).flatMap(hours => Object.values(hours))
  );

  // Procesar datos para Scatter plot temporal (X = fecha, Y = hora)
  const scatterData = (() => {
    // Verificar que hay datos antes de procesar
    if (!transcriptions || transcriptions.length === 0) {
      return { branches: [], dates: [], dateToX: {} };
    }
    
    const branches = [...new Set(transcriptions.map(t => t.branchName).filter(Boolean))];
    
    // Obtener todas las fechas únicas para el eje X
    const allDates = [...new Set(
      transcriptions
        .filter(t => t.recordingDate)
        .map(t => new Date(t.recordingDate).toDateString())
    )].sort((a, b) => new Date(a) - new Date(b));
    
    const dateToX = {};
    allDates.forEach((d, i) => { dateToX[d] = i; });
    
    return {
      branches: branches.map((branch, idx) => ({
        branch,
        color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
        data: transcriptions
          .filter(t => t.branchName === branch && t.recordingDate)
          .map(t => {
            const date = new Date(t.recordingDate);
            const dateStr = date.toDateString();
            return {
              x: dateToX[dateStr], // Fecha en X
              y: date.getHours() + date.getMinutes() / 60, // Hora en Y
              hour: date.getHours(),
              minutes: date.getMinutes(),
              dayName: DAYS_FULL[date.getDay()],
              dateStr: date.toLocaleDateString('es-AR'),
              branch,
              branchColor: BRANCH_COLORS[idx % BRANCH_COLORS.length],
              sale: t.saleCompleted
            };
          }) || []
      })),
      dates: allDates,
      dateToX
    };
  })();

  const tooltipStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: isDark ? '#fff' : '#374151'
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Sentimiento Promedio"
          value={sentimentAvg?.toFixed(2) || '0.00'}
          subtitle="Escala 1 a 5"
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="Índice de Fricción"
          value={`${frictionIndex?.toFixed(1) || '0.0'}%`}
          subtitle="Conversaciones con fricción"
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Riesgo Abandono Alto"
          value={`${abandonmentRiskHighPct?.toFixed(1) || '0.0'}%`}
          subtitle="Conversaciones críticas"
          icon={XCircle}
          variant="danger"
        />
        <MetricCard
          title="Calidad del Agente"
          value={agentQualityAvg?.toFixed(2) || '0.00'}
          subtitle="Promedio (1 a 5)"
          icon={Award}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CX Risk Score"
          value={cxRiskScoreAvg?.toFixed(2) || '0.00'}
          subtitle="Promedio de riesgo"
          icon={Clock}
          variant="default"
        />
        <MetricCard
          title="Cumplimiento Protocolo"
          value={`${protocolCompliancePct?.toFixed(1) || '0.0'}%`}
          subtitle="Saludo + identificación + cierre"
          icon={Users}
          variant="success"
        />
        <MetricCard
          title="Tasa Escalamiento"
          value={`${escalationRate?.toFixed(1) || '0.0'}%`}
          subtitle="Casos escalados"
          icon={TrendingUp}
          variant="warning"
        />
        <MetricCard
          title="Índice Riesgo Legal"
          value={`${legalRiskIndex?.toFixed(1) || '0.0'}%`}
          subtitle="Riesgo medio/alto"
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Top Agentes</h3>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Comparativa por resolución</p>
            </div>
            <Link to="/sellers" className="text-sm text-[#004F9F] font-semibold flex items-center gap-1 hover:text-[#003A79]">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sellerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerChartData} layout="vertical">
                <XAxis type="number" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} />
                <YAxis type="category" dataKey="name" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="resuelto" name="Resuelto" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="noResuelto" name="No resuelto" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* No Sale Reasons Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="mb-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Top motivos de contacto</h3>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Distribución principal de casos</p>
          </div>
          {noSaleReasonsData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie
                    data={noSaleReasonsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {noSaleReasonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-3">
                {noSaleReasonsData.slice(0, 5).map((item, index) => (
                  <div key={`${item.name || 'motivo'}-${index}`} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className={`text-sm truncate flex-1 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{item.name}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Ranking */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#004F9F]/20 rounded-xl">
              <Users className="w-5 h-5 text-[#004F9F]" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Ranking Agentes</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Por tasa de resolución</p>
            </div>
          </div>
          <div className="space-y-3">
            {sellerMetrics?.slice(0, 5).map((seller, index) => (
              <div 
                key={`${seller.userId ?? 'seller'}-${seller.userName ?? 'sin-nombre'}-${index}`}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#004F9F] to-[#003A79] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{seller.userName}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{seller.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{seller.conversionRate}%</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{seller.sales}/{seller.totalInteractions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#004F9F]/20 rounded-xl">
              <Building2 className="w-5 h-5 text-[#004F9F]" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Rendimiento Sucursales</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Por tasa de resolución</p>
            </div>
          </div>
          <div className="space-y-3">
            {branchMetrics?.slice(0, 5).map((branch, index) => (
              <div 
                key={`${branch.branchId ?? 'branch'}-${branch.branchName ?? 'sin-sucursal'}-${index}`}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#004F9F] to-[#003A79] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold capitalize truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{branch.branchName}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{branch.totalInteractions} atenciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{branch.conversionRate}%</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Score: {branch.averageScore?.toFixed(1) || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Distribution Section */}
      {transcriptions?.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#004F9F]/20 rounded-xl">
              <Clock className="w-5 h-5 text-[#004F9F]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Distribución de Tráfico</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Patrones de atención por horario y día</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap Semanal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#004F9F]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Heatmap Semanal</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                Intensidad de atenciones por día y hora
              </p>
              
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Header con horas */}
                  <div className="flex mb-1">
                    <div className="w-10"></div>
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(hour => (
                      <div key={hour} className={`flex-1 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                        {hour}h
                      </div>
                    ))}
                  </div>
                  
                  {/* Filas por día */}
                  {DAYS.map((day, dayIdx) => (
                    <div key={day} className="flex items-center mb-1">
                      <div className={`w-10 text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        {day}
                      </div>
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(hour => {
                        const value = heatmapData[dayIdx]?.[hour] || 0;
                        const intensity = value / maxHeatmapValue;
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-6 mx-0.5 rounded cursor-pointer transition-transform hover:scale-110"
                            style={{
                              backgroundColor: value === 0 
                                ? (isDark ? '#111111' : '#f1f5f9')
                                : `rgba(0, 79, 159, ${0.2 + intensity * 0.8})`,
                            }}
                            title={`${DAYS_FULL[dayIdx]} ${hour}:00 - ${value} atenciones`}
                          />
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Leyenda */}
                  <div className="flex items-center justify-end mt-4 gap-2">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Menos</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: `rgba(0, 79, 159, ${intensity})` }}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Más</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scatter Plot Temporal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#004F9F]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Atenciones por Horario</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                X = Fecha | Y = Hora | Color = Sucursal | Borde verde = resuelto
              </p>
              
              {scatterData.branches?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 40 }}>
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        domain={[-0.5, scatterData.dates.length - 0.5]}
                        ticks={scatterData.dates.map((_, i) => i)}
                        tickFormatter={(tick) => {
                          const dateStr = scatterData.dates[tick];
                          if (!dateStr) return '';
                          const d = new Date(dateStr);
                          return `${d.getDate()}/${d.getMonth()+1}`;
                        }}
                        stroke={isDark ? '#71717a' : '#9ca3af'}
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        domain={[7, 21]}
                        ticks={[8, 10, 12, 14, 16, 18, 20]}
                        tickFormatter={(tick) => `${tick}h`}
                        stroke={isDark ? '#71717a' : '#9ca3af'}
                        fontSize={10}
                        width={35}
                      />
                      <ZAxis range={[60, 60]} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className={`p-3 rounded-lg shadow-lg border ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {data.branch}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                  {data.dayName} {data.dateStr}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                  Hora: {data.hour}:{data.minutes.toString().padStart(2, '0')}
                                </p>
                                <p className={`text-sm font-medium mt-1 ${data.sale ? 'text-green-400' : 'text-red-400'}`}>
                                  {data.sale ? '✓ Resuelto' : '✗ No resuelto'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {scatterData.branches.map((branch) => (
                        <Scatter
                          key={branch.branch}
                          name={branch.branch}
                          data={branch.data}
                          shape={(props) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill={payload.branchColor}
                                fillOpacity={0.8}
                                stroke={payload.sale ? '#22c55e' : '#ef4444'}
                                strokeWidth={2}
                              />
                            );
                          }}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Leyenda de sucursales */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-800">
                    {scatterData.branches.map((branch) => (
                      <div key={branch.branch} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-400"
                          style={{ backgroundColor: branch.color }}
                        />
                        <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                          {branch.branch} ({branch.data.length})
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-green-500" />
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Resuelto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-red-500" />
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>No resuelto</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`h-48 flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Sin datos de fechas disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
