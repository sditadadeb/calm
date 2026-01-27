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

const COLORS = ['#f5a623', '#2d2d2d', '#6c757d', '#adb5bd', '#dee2e6'];

export default function Dashboard() {
  const { dashboardMetrics, loading, fetchDashboardMetrics } = useStore();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!dashboardMetrics) {
    return (
      <div className="bg-white rounded-[20px] p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-[#fff8eb] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#f5a623]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin datos disponibles</h3>
        <p className="text-gray-400">Sincroniza desde S3 para comenzar</p>
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#f5a623] to-[#e6951a] rounded-[20px] p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Bienvenido al Panel CALM</h1>
            <p className="text-white/80">
              Analiza el rendimiento de ventas y mejora la conversión
            </p>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <p className="text-white/70 text-sm">Total atenciones</p>
              <p className="text-4xl font-bold">{totalTranscriptions}</p>
            </div>
            <div className="w-px h-16 bg-white/30" />
            <div className="text-center">
              <p className="text-white/70 text-sm">Conversión</p>
              <p className="text-4xl font-bold">{conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

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
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#2d2d2d]">Top Vendedores</h3>
              <p className="text-sm text-gray-400">Comparativa de ventas</p>
            </div>
            <Link to="/sellers" className="text-sm text-[#f5a623] font-semibold flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sellerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerChartData} layout="vertical">
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #f0f0f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="ventas" name="Ventas" fill="#28a745" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sinVenta" name="Sin venta" fill="#dc3545" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* No Sale Reasons Chart */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#2d2d2d]">Razones de No Venta</h3>
            <p className="text-sm text-gray-400">Análisis de objeciones</p>
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
                      background: 'white', 
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px'
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
                    <span className="text-sm text-gray-600 truncate flex-1">{item.name}</span>
                    <span className="text-sm font-bold text-[#2d2d2d]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers Ranking */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#f5a623] to-[#e6951a] rounded-xl shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#2d2d2d]">Ranking Vendedores</h3>
              <p className="text-xs text-gray-400">Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {sellerMetrics?.slice(0, 5).map((seller, index) => (
              <div 
                key={seller.userId}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#fff8eb] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#f5a623] to-[#e6951a] text-white shadow-md' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-200 text-orange-800' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2d2d2d] truncate">{seller.userName}</p>
                  <p className="text-xs text-gray-400 truncate">{seller.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{seller.conversionRate}%</p>
                  <p className="text-xs text-gray-400">{seller.sales}/{seller.totalInteractions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#f5a623] to-[#e6951a] rounded-xl shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#2d2d2d]">Rendimiento Sucursales</h3>
              <p className="text-xs text-gray-400">Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {branchMetrics?.slice(0, 5).map((branch, index) => (
              <div 
                key={branch.branchId}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#fff8eb] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-[#f5a623] to-[#e6951a] text-white shadow-md' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-200 text-orange-800' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2d2d2d] capitalize truncate">{branch.branchName}</p>
                  <p className="text-xs text-gray-400">{branch.totalInteractions} atenciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{branch.conversionRate}%</p>
                  <p className="text-xs text-gray-400">Score: {branch.averageScore?.toFixed(1) || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
