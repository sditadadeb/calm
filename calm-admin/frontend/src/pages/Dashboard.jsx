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
import MetricCard from '../components/MetricCard';

// Colores CALM
const COLORS = ['#F5A623', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

// Días de la semana
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Colores para sucursales en scatter plot
const BRANCH_COLORS = ['#F5A623', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const { dashboardMetrics, transcriptions, loading, fetchDashboardMetrics, fetchTranscriptions } = useStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchDashboardMetrics();
    fetchTranscriptions();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando datos...</p>
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
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Sin datos disponibles</h3>
        <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Sincroniza desde S3 para comenzar</p>
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
    // Contar transcripciones
    transcriptions?.forEach(t => {
      if (t.recordingDate) {
        const date = new Date(t.recordingDate);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        matrix[day][hour]++;
      }
    });
    return matrix;
  })();

  // Obtener el máximo para escala de colores del heatmap
  const maxHeatmapValue = Math.max(
    1,
    ...Object.values(heatmapData).flatMap(hours => Object.values(hours))
  );

  // Procesar datos para Scatter plot temporal
  const scatterData = (() => {
    const branches = [...new Set(transcriptions?.map(t => t.branchName).filter(Boolean))];
    return branches.map((branch, idx) => ({
      branch,
      color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
      data: transcriptions
        ?.filter(t => t.branchName === branch && t.recordingDate)
        .map(t => {
          const date = new Date(t.recordingDate);
          return {
            x: date.getTime(),
            y: idx,
            hour: date.getHours(),
            day: DAYS_FULL[date.getDay()],
            date: date.toLocaleDateString('es-AR'),
            sale: t.saleCompleted
          };
        }) || []
    }));
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
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Top Vendedores</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Comparativa de ventas</p>
            </div>
            <Link to="/sellers" className="text-sm text-[#F5A623] font-semibold flex items-center gap-1 hover:text-[#FFBB54]">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sellerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sellerChartData} layout="vertical">
                <XAxis type="number" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} />
                <YAxis type="category" dataKey="name" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sinVenta" name="Sin venta" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* No Sale Reasons Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Razones de No Venta</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Análisis de objeciones</p>
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
                  <div key={item.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className={`text-sm truncate flex-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{item.name}</span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Sin datos disponibles
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
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Ranking Vendedores</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {sellerMetrics?.slice(0, 5).map((seller, index) => (
              <div 
                key={seller.userId}
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
              </div>
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
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Rendimiento Sucursales</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Por tasa de conversión</p>
            </div>
          </div>
          <div className="space-y-3">
            {branchMetrics?.slice(0, 5).map((branch, index) => (
              <div 
                key={branch.branchId}
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
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{branch.totalInteractions} atenciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{branch.conversionRate}%</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Score: {branch.averageScore?.toFixed(1) || '-'}</p>
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
            <div className="p-3 bg-[#F5A623]/20 rounded-xl">
              <Clock className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Distribución de Tráfico</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Patrones de atención por horario y día</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap Semanal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#F5A623]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Heatmap Semanal</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Intensidad de atenciones por día y hora
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
                            title={`${DAYS_FULL[dayIdx]} ${hour}:00 - ${value} atenciones`}
                          />
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Leyenda */}
                  <div className="flex items-center justify-end mt-4 gap-2">
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Menos</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: `rgba(245, 166, 35, ${intensity})` }}
                        />
                      ))}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Más</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scatter Plot Temporal */}
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#F5A623]" />
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Timeline por Sucursal</h3>
              </div>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Cada punto es una atención (verde = venta, rojo = sin venta)
              </p>
              
              {scatterData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(tick) => {
                          const d = new Date(tick);
                          return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:00`;
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
                        domain={[-0.5, scatterData.length - 0.5]}
                        tickFormatter={(tick) => scatterData[tick]?.branch?.substring(0, 8) || ''}
                        stroke={isDark ? '#64748b' : '#9ca3af'}
                        fontSize={10}
                        width={70}
                      />
                      <ZAxis range={[30, 30]} />
                      <Tooltip 
                        contentStyle={tooltipStyle}
                        formatter={(value, name, props) => {
                          const point = props.payload;
                          return null;
                        }}
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className={`p-2 rounded-lg shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                  {data.day} {data.date}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  Hora: {data.hour}:00
                                </p>
                                <p className={`text-sm font-medium ${data.sale ? 'text-green-400' : 'text-red-400'}`}>
                                  {data.sale ? '✓ Venta' : '✗ Sin venta'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {scatterData.map((branch, idx) => (
                        <Scatter
                          key={branch.branch}
                          name={branch.branch}
                          data={branch.data}
                          fill={branch.color}
                          shape={(props) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={5}
                                fill={payload.sale ? '#22c55e' : '#ef4444'}
                                fillOpacity={0.7}
                                stroke={payload.sale ? '#16a34a' : '#dc2626'}
                                strokeWidth={1}
                              />
                            );
                          }}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Leyenda de sucursales */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {scatterData.map((branch) => (
                      <div key={branch.branch} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: branch.color }}
                        />
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {branch.branch} ({branch.data.length})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={`h-48 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
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
