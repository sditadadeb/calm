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

export default function Branches() {
  const { dashboardMetrics, loading, fetchDashboardMetrics } = useStore();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando sucursales...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Sucursales</h1>
        <p className="text-gray-500 mt-1">Rendimiento por ubicación</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-[#1a1a2e] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{branches.length}</p>
          <p className="text-gray-500 text-sm mt-1">Sucursales activas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">
            {branches.length > 0 ? Math.max(...branches.map(b => b.conversionRate)).toFixed(1) : 0}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Mejor conversión</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">
            {branches.reduce((acc, b) => acc + b.totalInteractions, 0)}
          </p>
          <p className="text-gray-500 text-sm mt-1">Total atenciones</p>
        </div>
      </div>

      {/* Charts */}
      {branches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">Conversión por Sucursal</h3>
            <p className="text-sm text-gray-400 mb-6">Tasa de cierre de ventas</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => [`${value}%`, 'Conversión']}
                />
                <Bar dataKey="conversion" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">Score por Sucursal</h3>
            <p className="text-sm text-gray-400 mb-6">Puntuación promedio de vendedores</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}
                  formatter={(value) => [value.toFixed(1), 'Score']}
                />
                <Bar dataKey="score" fill="#28a745" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Branches Table */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay sucursales</h3>
          <p className="text-gray-400">Sincroniza datos desde S3</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Sucursal</th>
                <th>Atenciones</th>
                <th>Ventas</th>
                <th>Sin Venta</th>
                <th>Conversión</th>
                <th>Score</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch, index) => (
                <tr key={branch.branchId}>
                  <td>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-[#1a1a2e] capitalize">{branch.branchName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-[#1a1a2e]">{branch.totalInteractions}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-green-600">{branch.sales}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-red-600">{branch.noSales}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        branch.conversionRate >= 50 ? 'text-green-600' :
                        branch.conversionRate >= 30 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {branch.conversionRate}%
                      </span>
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                  <td>
                    <span className={`font-bold ${
                      branch.averageScore >= 7 ? 'text-green-600' :
                      branch.averageScore >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {branch.averageScore?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/transcriptions?branchId=${branch.branchId}`}
                      className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1"
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
