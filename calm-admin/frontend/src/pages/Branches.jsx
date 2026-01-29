import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, Eye, MapPin } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';

export default function Branches() {
  const { dashboardMetrics, loading, fetchDashboardMetrics } = useStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  const branches = dashboardMetrics?.branchMetrics || [];

  const chartData = branches.map(b => ({
    name: b.branchName?.substring(0, 10) || 'N/A',
    conversion: b.conversionRate,
    atenciones: b.totalInteractions,
    score: b.averageScore || 0
  }));

  const tooltipStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: isDark ? '#fff' : '#374151'
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 border border-l-4 border-l-[#F5A623] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sucursales activas</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{branches.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#F5A623]/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#F5A623]" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border border-l-4 border-l-green-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mejor conversión</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {branches.length > 0 ? Math.max(...branches.map(b => b.conversionRate)).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border border-l-4 border-l-blue-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total atenciones</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {branches.reduce((acc, b) => acc + b.totalInteractions, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {branches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Conversión por Sucursal</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tasa de cierre de ventas</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={11} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Conversión']} />
                <Bar dataKey="conversion" fill={isDark ? '#334155' : '#F5A623'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Score por Sucursal</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Puntuación promedio de vendedores</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={11} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke={isDark ? '#64748b' : '#9ca3af'} fontSize={12} domain={[0, 10]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value.toFixed(1), 'Score']} />
                <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Branches Table */}
      {branches.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <Building2 className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No hay sucursales</h3>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Sincroniza datos desde S3</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <table className="w-full">
            <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Posición</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sucursal</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Atenciones</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ventas</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sin Venta</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Conversión</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Score</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {branches.map((branch, index) => (
                <tr key={branch.branchId} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54] text-white' :
                      index === 1 ? 'bg-slate-400 text-slate-800' :
                      index === 2 ? 'bg-amber-700 text-amber-100' :
                      isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <MapPin className="w-5 h-5 text-[#F5A623]" />
                      </div>
                      <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{branch.branchName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{branch.totalInteractions}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-400">{branch.sales}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-red-400">{branch.noSales}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        branch.conversionRate >= 50 ? 'text-green-400' :
                        branch.conversionRate >= 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {branch.conversionRate}%
                      </span>
                      <div className={`w-16 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full ${
                            branch.conversionRate >= 50 ? 'bg-green-500' :
                            branch.conversionRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${branch.conversionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      branch.averageScore >= 7 ? 'text-green-400' :
                      branch.averageScore >= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {branch.averageScore?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/transcriptions?branchId=${branch.branchId}`}
                      className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-[#F5A623] hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F5A623] hover:text-white'}`}
                    >
                      <Eye className="w-3 h-3" /> Ver atenciones
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
