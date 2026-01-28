import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShoppingCart, 
  XCircle, 
  Award,
  Users,
  Building2,
  ArrowRight,
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
  Cell
} from 'recharts';
import useStore from '../store/useStore';
import MetricCard from '../components/MetricCard';

// Colores CALM
const COLORS = ['#F5A623', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

export default function Dashboard() {
  const { dashboardMetrics, loading, fetchDashboardMetrics } = useStore();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!dashboardMetrics) {
    return (
      <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#F5A623]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Sin datos disponibles</h3>
        <p className="text-slate-400">Sincroniza desde S3 para comenzar</p>
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
    noSaleReasons 
  } = dashboardMetrics;

  const sellerChartData = sellerMetrics?.slice(0, 5).map(s => ({
    name: s.userName?.split(' ')[0] || 'N/A',
    ventas: s.sales,
    sinVenta: s.noSales,
  })) || [];

  const noSaleReasonsData = noSaleReasons 
    ? Object.entries(noSaleReasons).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Atenciones"
          value={totalTranscriptions}
          subtitle="Transcripciones"
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="Ventas"
          value={totalSales}
          subtitle={`${conversionRate}% conversión`}
          icon={ShoppingCart}
          variant="success"
        />
        <MetricCard
          title="Sin Venta"
          value={totalNoSales}
          subtitle="Oportunidades"
          icon={XCircle}
          variant="danger"
        />
        <MetricCard
          title="Score Promedio"
          value={averageSellerScore?.toFixed(1) || '-'}
          subtitle="Calificación"
          icon={Award}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Chart */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Top Vendedores</h3>
              <p className="text-sm text-slate-400">Comparativa de ventas</p>
            </div>
            <Link to="/sellers" className="text-sm text-[#F5A623] font-semibold flex items-center gap-1 hover:text-[#FFBB54]">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sellerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerChartData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sinVenta" name="Sin venta" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* No Sale Reasons Chart */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Razones de No Venta</h3>
            <p className="text-sm text-slate-400">Análisis de objeciones</p>
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
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-3">
                {noSaleReasonsData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-300 truncate flex-1">{item.name}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Ranking */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Users className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Ranking Vendedores</h3>
              <p className="text-xs text-slate-400">Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {sellerMetrics?.slice(0, 5).map((seller, index) => (
              <div 
                key={seller.userId}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  'bg-slate-600 text-slate-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{seller.userName}</p>
                  <p className="text-xs text-slate-400 truncate">{seller.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{seller.conversionRate}%</p>
                  <p className="text-xs text-slate-400">{seller.sales}/{seller.totalInteractions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Building2 className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Rendimiento Sucursales</h3>
              <p className="text-xs text-slate-400">Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {branchMetrics?.slice(0, 5).map((branch, index) => (
              <div 
                key={branch.branchId}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54] text-white' :
                  index === 1 ? 'bg-slate-400 text-slate-800' :
                  index === 2 ? 'bg-amber-700 text-amber-100' :
                  'bg-slate-600 text-slate-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white capitalize truncate">{branch.branchName}</p>
                  <p className="text-xs text-slate-400">{branch.totalInteractions} atenciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{branch.conversionRate}%</p>
                  <p className="text-xs text-slate-400">Score: {branch.averageScore?.toFixed(1) || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
