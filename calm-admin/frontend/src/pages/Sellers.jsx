import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Award, Eye, Trophy } from 'lucide-react';
import useStore from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import ScoreBadge from '../components/ScoreBadge';

export default function Sellers() {
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
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Cargando vendedores...</p>
        </div>
      </div>
    );
  }

  const allSellers = dashboardMetrics?.sellerMetrics || [];
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const sellers = currentUser.sellerId 
    ? allSellers.filter(s => String(s.userId) === String(currentUser.sellerId))
    : allSellers;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 border border-l-4 border-l-[#F5A623] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Vendedores activos</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{sellers.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#F5A623]/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#F5A623]" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border border-l-4 border-l-green-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mejor conversión</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {sellers.length > 0 ? Math.max(...sellers.map(s => s.conversionRate)).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border border-l-4 border-l-amber-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Score promedio</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {sellers.length > 0 
                  ? (sellers.reduce((acc, s) => acc + (s.averageScore || 0), 0) / sellers.length).toFixed(1) 
                  : '-'}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Sellers Grid */}
      {sellers.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <Users className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No hay vendedores</h3>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Sincroniza datos desde S3</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller, index) => (
            <div 
              key={seller.userId}
              className={`rounded-2xl p-6 border transition-all relative overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700 hover:border-[#F5A623]/50' : 'bg-white border-gray-200 hover:border-[#F5A623]/50 hover:shadow-lg'}`}
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-gradient-to-br from-[#F5A623] to-[#FFBB54]' :
                  index === 1 ? 'bg-slate-400' :
                  'bg-amber-700'
                }`}>
                  <Trophy className={`w-4 h-4 ${
                    index === 0 ? 'text-white' :
                    index === 1 ? 'text-slate-800' :
                    'text-amber-100'
                  }`} />
                </div>
              )}

              {/* Seller Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                  <span className="text-xl font-bold text-[#F5A623]">
                    {seller.userName?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{seller.userName}</h3>
                  <p className={`text-sm capitalize truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{seller.branchName}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{seller.totalInteractions}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Atenciones</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${
                    seller.conversionRate >= 50 ? 'text-green-400' :
                    seller.conversionRate >= 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {seller.conversionRate}%
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Conversión</p>
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Ventas</span>
                    <span className="font-semibold text-green-400">{seller.sales}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(seller.sales / seller.totalInteractions) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Sin venta</span>
                    <span className="font-semibold text-red-400">{seller.noSales}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(seller.noSales / seller.totalInteractions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <ScoreBadge score={Math.round(seller.averageScore)} size="small" />
                <Link
                  to={`/transcriptions?userId=${seller.userId}`}
                  className={`text-xs py-2 px-3 inline-flex items-center gap-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-[#F5A623] hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F5A623] hover:text-white'}`}
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
