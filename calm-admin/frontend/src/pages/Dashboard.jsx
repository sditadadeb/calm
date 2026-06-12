import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShoppingCart, 
  XCircle, 
  Award,
  Users,
  Building2,
  ArrowRight,
  Clock,
  Calendar
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
import { useLanguage } from '../context/LanguageContext';
import MetricCard from '../components/MetricCard';

// Colores CALM
const COLORS = ['#F5A623', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

// Colores para sucursales en scatter plot
const BRANCH_COLORS = ['#F5A623', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const PERIOD_OPTIONS = [
  { value: '7', labelKey: 'period7d' },
  { value: '30', labelKey: 'period30d' },
  { value: '90', labelKey: 'period90d' },
  { value: 'all', labelKey: 'periodAll' },
];

function periodDateRange(periodDays) {
  if (periodDays === 'all') return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Number(periodDays));
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

function buildTranscriptionsLink(periodDays, extra = {}) {
  const params = new URLSearchParams();
  Object.entries({ analyzed: 'true', ...periodDateRange(periodDays), ...extra }).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, v);
  });
  return `/transcriptions?${params.toString()}`;
}

function isAnalyzed(t) {
  return t.analyzed === true;
}

function isUninterpretableOrError(t) {
  if (t.saleStatus === 'UNINTERPRETABLE') return true;
  const reason = (t.noSaleReason || '').toLowerCase();
  if (reason.startsWith('error parseando')) return true;
  return reason.includes('transcripcion no interpretable') || reason.includes('transcripción no interpretable');
}

function inPeriod(t, periodDays) {
  if (!t.recordingDate) return false;
  if (periodDays === 'all') return true;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(periodDays));
  cutoff.setHours(0, 0, 0, 0);
  return new Date(t.recordingDate) >= cutoff;
}

function buildSellerMetrics(list) {
  const map = new Map();
  for (const t of list) {
    const key = t.userId ?? t.userName;
    if (!map.has(key)) {
      map.set(key, {
        userId: t.userId,
        userName: t.userName,
        branchName: t.branchName,
        totalInteractions: 0,
        sales: 0,
        noSales: 0,
        scores: [],
      });
    }
    const s = map.get(key);
    s.totalInteractions++;
    if (t.saleCompleted === true) s.sales++;
    if (t.saleCompleted === false) s.noSales++;
    if (t.sellerScore != null) s.scores.push(t.sellerScore);
  }
  return [...map.values()]
    .map(s => ({
      ...s,
      conversionRate: s.totalInteractions > 0 ? Math.round((s.sales / s.totalInteractions) * 100) : 0,
      averageScore: s.scores.length ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
    }))
    .filter(s => s.totalInteractions > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function buildBranchMetrics(list) {
  const map = new Map();
  for (const t of list) {
    const key = t.branchId ?? t.branchName;
    if (!map.has(key)) {
      map.set(key, {
        branchId: t.branchId,
        branchName: t.branchName,
        totalInteractions: 0,
        sales: 0,
        noSales: 0,
        scores: [],
      });
    }
    const b = map.get(key);
    b.totalInteractions++;
    if (t.saleCompleted === true) b.sales++;
    if (t.saleCompleted === false) b.noSales++;
    if (t.sellerScore != null) b.scores.push(t.sellerScore);
  }
  return [...map.values()]
    .map(b => ({
      ...b,
      conversionRate: b.totalInteractions > 0 ? Math.round((b.sales / b.totalInteractions) * 100) : 0,
      averageScore: b.scores.length ? b.scores.reduce((a, c) => a + c, 0) / b.scores.length : 0,
    }))
    .filter(b => b.totalInteractions > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function buildNoSaleReasons(list) {
  const counts = {};
  for (const t of list) {
    if (t.saleCompleted !== false || !t.noSaleReason) continue;
    if (isUninterpretableOrError(t)) continue;
    counts[t.noSaleReason] = (counts[t.noSaleReason] || 0) + 1;
  }
  return counts;
}

export default function Dashboard() {
  const { dashboardMetrics, transcriptions, loading, fetchDashboardMetrics, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [periodDays, setPeriodDays] = useState('30');
  const DAYS = t('dashboard.daysShort') || [];
  const DAYS_FULL = t('dashboard.daysLong') || [];

  useEffect(() => {
    fetchDashboardMetrics();
    fetchTranscriptions();
  }, [fetchDashboardMetrics, fetchTranscriptions]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userSellerId = currentUser.sellerId;

  const analyzedInPeriod = useMemo(() => {
    let list = transcriptions || [];
    if (userSellerId) {
      list = list.filter(tr => String(tr.userId) === String(userSellerId));
    }
    return list.filter(tr => isAnalyzed(tr) && inPeriod(tr, periodDays));
  }, [transcriptions, userSellerId, periodDays]);

  const actionableInPeriod = useMemo(
    () => analyzedInPeriod.filter(tr => !isUninterpretableOrError(tr)),
    [analyzedInPeriod]
  );

  const pendingCount = dashboardMetrics?.pendingAnalysis ?? 0;

  const drillDownLinks = useMemo(() => ({
    all: buildTranscriptionsLink(periodDays),
    sales: buildTranscriptionsLink(periodDays, { saleCompleted: 'true' }),
    noSales: buildTranscriptionsLink(periodDays, { saleCompleted: 'false' }),
    pending: '/transcriptions?analyzed=false',
  }), [periodDays]);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.loadingData')}</p>
        </div>
      </div>
    );
  }

  if (!dashboardMetrics) {
    return (
      <div className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <FileText className="w-8 h-8 text-[#F5A623]" />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.noData')}</h3>
        <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('dashboard.syncToStart')}</p>
      </div>
    );
  }

  // Métricas comerciales: excluye no interpretables y errores de parseo
  const totalTranscriptions = actionableInPeriod.length;
  const totalSales = actionableInPeriod.filter(tr => tr.saleCompleted === true).length;
  const totalNoSales = actionableInPeriod.filter(tr => tr.saleCompleted === false).length;
  const conversionRate = totalTranscriptions > 0 ? Math.round((totalSales / totalTranscriptions) * 100) : 0;
  const scored = actionableInPeriod.filter(tr => tr.sellerScore != null && tr.sellerScore > 0);
  const averageSellerScore = scored.length
    ? scored.reduce((sum, tr) => sum + tr.sellerScore, 0) / scored.length
    : 0;

  const sellerMetrics = buildSellerMetrics(actionableInPeriod);
  const branchMetrics = buildBranchMetrics(actionableInPeriod);
  const noSaleReasons = buildNoSaleReasons(actionableInPeriod);

  const sellerChartData = sellerMetrics?.slice(0, 5).map(s => ({
    name: s.userName?.split(' ')[0] || 'N/A',
    ventas: s.sales,
    sinVenta: s.noSales,
  })) || [];

  const noSaleReasonsData = noSaleReasons 
    ? Object.entries(noSaleReasons)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
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
    if (analyzedInPeriod.length > 0) {
      analyzedInPeriod.forEach(tr => {
        if (tr.recordingDate) {
          const date = new Date(tr.recordingDate);
          const day = date.getDay();
          const hour = date.getHours();
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
    if (!analyzedInPeriod || analyzedInPeriod.length === 0) {
      return { branches: [], dates: [], dateToX: {} };
    }
    
    const branches = [...new Set(analyzedInPeriod.map(tr => tr.branchName).filter(Boolean))];
    
    const allDates = [...new Set(
      analyzedInPeriod
        .filter(tr => tr.recordingDate)
        .map(tr => new Date(tr.recordingDate).toDateString())
    )].sort((a, b) => new Date(a) - new Date(b));
    
    const dateToX = {};
    allDates.forEach((d, i) => { dateToX[d] = i; });
    
    return {
      branches: branches.map((branch, idx) => ({
        branch,
        color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
        data: analyzedInPeriod
          .filter(tr => tr.branchName === branch && tr.recordingDate)
          .map(tr => {
            const date = new Date(tr.recordingDate);
            const dateStr = date.toDateString();
            return {
              x: dateToX[dateStr],
              y: date.getHours() + date.getMinutes() / 60,
              hour: date.getHours(),
              minutes: date.getMinutes(),
              dayName: DAYS_FULL[date.getDay()],
              dateStr: date.toLocaleDateString('es-AR'),
              branch,
              branchColor: BRANCH_COLORS[idx % BRANCH_COLORS.length],
              sale: tr.saleCompleted
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
      {/* Period selector + pending notice */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {t('dashboard.period')}
          </label>
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{t(`dashboard.${opt.labelKey}`)}</option>
            ))}
          </select>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {t('dashboard.analyzedOnly')}
          </span>
        </div>
        {pendingCount > 0 && !userSellerId && (
          <Link
            to={drillDownLinks.pending}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-amber-700/50 text-amber-400 hover:bg-amber-900/20' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}
          >
            {pendingCount} {t('dashboard.pendingAnalysis')}
          </Link>
        )}
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('dashboard.totalAttendances')}
          value={totalTranscriptions}
          subtitle={t('dashboard.transcriptions')}
          icon={FileText}
          variant="default"
          to={drillDownLinks.all}
        />
        <MetricCard
          title={t('dashboard.sales')}
          value={totalSales}
          subtitle={`${conversionRate}% conversión`}
          icon={ShoppingCart}
          variant="success"
          to={drillDownLinks.sales}
        />
        <MetricCard
          title={t('dashboard.noSale')}
          value={totalNoSales}
          subtitle={t('dashboard.opportunities')}
          icon={XCircle}
          variant="danger"
          to={drillDownLinks.noSales}
        />
        <MetricCard
          title={t('dashboard.avgScore')}
          value={averageSellerScore?.toFixed(1) || '-'}
          subtitle={t('dashboard.rating')}
          icon={Award}
          variant="warning"
          to={drillDownLinks.all}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.topSellers')}</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.salesComparison')}</p>
            </div>
            <Link to="/sellers" className="text-sm text-[#F5A623] font-semibold flex items-center gap-1 hover:text-[#FFBB54]">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sellerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerChartData} layout="vertical">
                <XAxis type="number" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} />
                <YAxis type="category" dataKey="name" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="ventas" name={t('dashboard.sales')} fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sinVenta" name={t('dashboard.noSaleShort')} fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {t('dashboard.noData')}
            </div>
          )}
        </div>

        {/* No Sale Reasons Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.noSaleReasons')}</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.objectionAnalysis')}</p>
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
                  <Link
                    key={item.name}
                    to={buildTranscriptionsLink(periodDays, { saleCompleted: 'false', noSaleReason: item.name })}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className={`text-sm truncate flex-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{item.name}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.value}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {t('dashboard.noData')}
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Ranking */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Users className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.sellerRanking')}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('dashboard.byConversionRate')} · {t(`dashboard.${PERIOD_OPTIONS.find(p => p.value === periodDays)?.labelKey || 'period30d'}`)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {sellerMetrics?.slice(0, 5).map((seller, index) => (
              <Link
                key={seller.userId}
                to={buildTranscriptionsLink(periodDays, { userId: seller.userId })}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{seller.userName}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{seller.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{seller.conversionRate}%</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{seller.sales}/{seller.totalInteractions}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Building2 className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.branchPerformance')}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.byConversionRate')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {branchMetrics?.slice(0, 5).map((branch, index) => (
              <Link
                key={branch.branchId}
                to={buildTranscriptionsLink(periodDays, { branchId: branch.branchId })}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold capitalize truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{branch.branchName}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{branch.totalInteractions} {t('dashboard.attendances')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{branch.conversionRate}%</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Score: {branch.averageScore?.toFixed(1) || '-'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Distribution Section */}
      {analyzedInPeriod.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Clock className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.trafficDistribution')}</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.attendancePatterns')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap Semanal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#F5A623]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.weeklyHeatmap')}</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('dashboard.heatmapDesc')}
              </p>
              
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {/* Header con horas */}
                  <div className="flex mb-1">
                    <div className="w-10"></div>
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(hour => (
                      <div key={hour} className={`flex-1 text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {hour}h
                      </div>
                    ))}
                  </div>
                  
                  {/* Filas por día */}
                  {DAYS.map((day, dayIdx) => (
                    <div key={day} className="flex items-center mb-1">
                      <div className={`w-10 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                                ? (isDark ? '#1e293b' : '#f1f5f9')
                                : `rgba(245, 166, 35, ${0.2 + intensity * 0.8})`,
                            }}
                            title={`${DAYS_FULL[dayIdx]} ${hour}:00 - ${value} ${t('dashboard.attendances')}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Leyenda */}
                  <div className="flex items-center justify-end mt-4 gap-2">
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('dashboard.less')}</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: `rgba(245, 166, 35, ${intensity})` }}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('dashboard.more')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scatter Plot Temporal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#F5A623]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dashboard.attendancesByTime')}</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('dashboard.scatterDesc')}
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
                        stroke={isDark ? '#64748b' : '#9ca3af'}
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
                        stroke={isDark ? '#64748b' : '#9ca3af'}
                        fontSize={10}
                        width={35}
                      />
                      <ZAxis range={[60, 60]} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className={`p-3 rounded-lg shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {data.branch}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  {data.dayName} {data.dateStr}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  {t('dashboard.time')}: {data.hour}:{data.minutes.toString().padStart(2, '0')}
                                </p>
                                <p className={`text-sm font-medium mt-1 ${data.sale ? 'text-green-400' : 'text-red-400'}`}>
                                  {data.sale ? t('dashboard.saleCompleted') : t('dashboard.noSaleCompleted')}
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
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700">
                    {scatterData.branches.map((branch) => (
                      <div key={branch.branch} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-400"
                          style={{ backgroundColor: branch.color }}
                        />
                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                          {branch.branch} ({branch.data.length})
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-green-500" />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.sale')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-red-500" />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('dashboard.noSaleShort')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`h-48 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t('dashboard.noDateData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
