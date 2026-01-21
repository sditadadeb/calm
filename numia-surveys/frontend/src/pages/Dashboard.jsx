import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Mail, 
  Smartphone,
  Plus,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import useAnalyticsStore from '../stores/analyticsStore';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, subValue, trend, color }) => (
  <div className="card hover:scale-[1.02] transition-transform">
    <div className="flex items-start justify-between mb-4">
      <div className={clsx(
        'w-12 h-12 rounded-xl flex items-center justify-center',
        color
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className={clsx(
          'flex items-center gap-1 text-sm font-medium',
          trend > 0 ? 'text-green-400' : 'text-red-400'
        )}>
          <TrendingUp className={clsx('w-4 h-4', trend < 0 && 'rotate-180')} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-white/50">{label}</p>
    {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
  </div>
);

const NpsGauge = ({ score, promoters, passives, detractors }) => {
  const data = [
    { name: 'Promotores', value: promoters, color: '#22c55e' },
    { name: 'Pasivos', value: passives, color: '#eab308' },
    { name: 'Detractores', value: detractors, color: '#ef4444' },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Net Promoter Score</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                innerRadius={35}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={clsx(
              'text-2xl font-bold',
              score >= 50 ? 'text-green-400' : score >= 0 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {score?.toFixed(0) || '-'}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-white/70">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { dashboardMetrics, fetchDashboardMetrics, loading } = useAnalyticsStore();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  if (loading && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const metrics = dashboardMetrics || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">Resumen de tu actividad de encuestas</p>
        </div>
        <Link to="/surveys/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          Nueva Encuesta
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="Total Encuestas"
          value={metrics.totalSurveys || 0}
          subValue={`${metrics.activeSurveys || 0} activas`}
          color="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          icon={MessageSquare}
          label="Respuestas Totales"
          value={metrics.totalResponses || 0}
          subValue={`${metrics.responsesThisMonth || 0} este mes`}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Mail}
          label="Emails Enviados"
          value={metrics.emailsSent || 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Smartphone}
          label="SMS Enviados"
          value={metrics.smsSent || 0}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NpsGauge 
          score={metrics.overallNps}
          promoters={metrics.promoters || 0}
          passives={metrics.passives || 0}
          detractors={metrics.detractors || 0}
        />

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Rendimiento</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Tasa de Completación</span>
              <span className="text-white font-medium">{metrics.averageCompletionRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                style={{ width: `${metrics.averageCompletionRate || 0}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Tasa de Apertura</span>
              <span className="text-white font-medium">{metrics.averageOpenRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${metrics.averageOpenRate || 0}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70">Tasa de Respuesta</span>
              <span className="text-white font-medium">{metrics.averageResponseRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${metrics.averageResponseRate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Surveys */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Encuestas Destacadas</h3>
          <Link to="/surveys" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        {metrics.topSurveys?.length > 0 ? (
          <div className="space-y-3">
            {metrics.topSurveys.map((survey) => (
              <Link
                key={survey.id}
                to={`/surveys/${survey.id}/analytics`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <div>
                  <p className="font-medium text-white">{survey.title}</p>
                  <p className="text-sm text-white/50">{survey.responses} respuestas</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    survey.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                    survey.status === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/60'
                  )}>
                    {survey.status === 'ACTIVE' ? 'Activa' : 
                     survey.status === 'DRAFT' ? 'Borrador' : 
                     survey.status === 'CLOSED' ? 'Cerrada' : survey.status}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-white/40" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No tienes encuestas aún</p>
            <Link to="/surveys/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Crear primera encuesta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

