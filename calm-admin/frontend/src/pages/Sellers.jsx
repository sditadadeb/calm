import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Award, Eye, Trophy } from 'lucide-react';
import useStore from '../store/useStore';
import ScoreBadge from '../components/ScoreBadge';

export default function Sellers() {
  const { dashboardMetrics, loading, fetchDashboardMetrics } = useStore();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Cargando vendedores...</p>
        </div>
      </div>
    );
  }

  const sellers = dashboardMetrics?.sellerMetrics || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Vendedores</h1>
        <p className="text-gray-500 mt-1">Análisis de rendimiento individual</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-[#1a1a2e] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{sellers.length}</p>
          <p className="text-gray-500 text-sm mt-1">Vendedores activos</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">
            {sellers.length > 0 ? Math.max(...sellers.map(s => s.conversionRate)).toFixed(1) : 0}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Mejor conversión</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">
            {sellers.length > 0 
              ? (sellers.reduce((acc, s) => acc + (s.averageScore || 0), 0) / sellers.length).toFixed(1) 
              : '-'}
          </p>
          <p className="text-gray-500 text-sm mt-1">Score promedio</p>
        </div>
      </div>

      {/* Sellers Grid */}
      {sellers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay vendedores</h3>
          <p className="text-gray-400">Sincroniza datos desde S3</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller, index) => (
            <div 
              key={seller.userId}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden"
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-400' :
                  index === 1 ? 'bg-gray-300' :
                  'bg-orange-300'
                }`}>
                  <Trophy className={`w-4 h-4 ${
                    index === 0 ? 'text-yellow-800' :
                    index === 1 ? 'text-gray-600' :
                    'text-orange-700'
                  }`} />
                </div>
              )}

              {/* Seller Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {seller.userName?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1a1a2e] truncate">{seller.userName}</h3>
                  <p className="text-sm text-gray-400 capitalize truncate">{seller.branchName}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a1a2e]">{seller.totalInteractions}</p>
                  <p className="text-xs text-gray-500">Atenciones</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${
                    seller.conversionRate >= 50 ? 'text-green-600' :
                    seller.conversionRate >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {seller.conversionRate}%
                  </p>
                  <p className="text-xs text-gray-500">Conversión</p>
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Ventas</span>
                    <span className="font-semibold text-green-600">{seller.sales}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(seller.sales / seller.totalInteractions) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Sin venta</span>
                    <span className="font-semibold text-red-600">{seller.noSales}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(seller.noSales / seller.totalInteractions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <ScoreBadge score={Math.round(seller.averageScore)} size="small" />
                <Link
                  to={`/transcriptions?userId=${seller.userId}`}
                  className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Ver atenciones
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
