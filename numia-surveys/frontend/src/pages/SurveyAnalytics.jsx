import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, CheckCircle, Clock, TrendingUp,
  Download, Loader2, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAnalyticsStore from '../stores/analyticsStore';
import useSurveyStore from '../stores/surveyStore';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, subLabel, color }) => (
  <div className="card">
    <div className="flex items-center gap-3">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/50">{label}</p>
        {subLabel && <p className="text-xs text-white/40">{subLabel}</p>}
      </div>
    </div>
  </div>
);

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function SurveyAnalytics() {
  const { id } = useParams();
  const { surveyAnalytics, fetchSurveyAnalytics, loading } = useAnalyticsStore();
  const { currentSurvey, fetchSurvey } = useSurveyStore();

  useEffect(() => {
    fetchSurveyAnalytics(id);
    fetchSurvey(id);
  }, [id]);

  if (loading || !surveyAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/surveys"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{surveyAnalytics.surveyTitle}</h1>
            <p className="text-white/60">Analytics de encuesta</p>
          </div>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Respuestas Totales"
          value={surveyAnalytics.totalResponses || 0}
          color="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Completadas"
          value={surveyAnalytics.completedResponses || 0}
          subLabel={`${surveyAnalytics.completionRate?.toFixed(1) || 0}% tasa`}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Clock}
          label="Tiempo Promedio"
          value={formatTime(surveyAnalytics.averageCompletionTime)}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="NPS Score"
          value={surveyAnalytics.npsScore?.toFixed(0) || '-'}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* NPS Breakdown */}
      {surveyAnalytics.npsScore !== null && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Net Promoter Score</h3>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="text-center">
              <div className={clsx(
                'text-5xl font-bold mb-2',
                surveyAnalytics.npsScore >= 50 ? 'text-green-400' :
                surveyAnalytics.npsScore >= 0 ? 'text-yellow-400' : 'text-red-400'
              )}>
                {surveyAnalytics.npsScore?.toFixed(0)}
              </div>
              <p className="text-white/50">NPS Score</p>
            </div>
            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{surveyAnalytics.promoters}</div>
                <p className="text-sm text-white/50">Promotores (9-10)</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{surveyAnalytics.passives}</div>
                <p className="text-sm text-white/50">Pasivos (7-8)</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{surveyAnalytics.detractors}</div>
                <p className="text-sm text-white/50">Detractores (0-6)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Analytics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Análisis por Pregunta</h3>
        
        {surveyAnalytics.questionAnalytics?.map((qa) => (
          <div key={qa.questionId} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-medium">{qa.questionText}</p>
                <p className="text-sm text-white/50">{qa.responseCount} respuestas • {qa.questionType}</p>
              </div>
            </div>

            {/* Rating Distribution */}
            {qa.ratingDistribution && Object.keys(qa.ratingDistribution).length > 0 && (
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={Object.entries(qa.ratingDistribution).map(([rating, count]) => ({
                    rating,
                    count
                  }))}>
                    <XAxis dataKey="rating" stroke="#ffffff40" />
                    <YAxis stroke="#ffffff40" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#4a4de6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Option Distribution */}
            {qa.optionCounts && Object.keys(qa.optionCounts).length > 0 && (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(qa.optionCounts).map(([option, count]) => ({
                          name: option,
                          value: count
                        }))}
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {Object.keys(qa.optionCounts).map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {Object.entries(qa.optionCounts).map(([option, count], idx) => (
                    <div key={option} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm text-white/70 truncate max-w-[200px]">{option}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{count}</span>
                        <span className="text-xs text-white/50">
                          ({qa.optionPercentages?.[option]?.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Responses Sample */}
            {qa.sampleResponses?.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-white/50 mb-2">Respuestas de texto ({qa.totalTextResponses})</p>
                {qa.sampleResponses.slice(0, 5).map((response, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/5 text-sm text-white/70">
                    "{response}"
                  </div>
                ))}
              </div>
            )}

            {/* Average Rating */}
            {qa.averageRating && (
              <div className="mt-4 flex items-center gap-4">
                <span className="text-white/50">Promedio:</span>
                <span className="text-xl font-bold text-primary-400">{qa.averageRating.toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Distribution Performance */}
      {surveyAnalytics.distributionPerformance?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Rendimiento de Distribuciones</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-white/50 border-b border-white/10">
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Canal</th>
                  <th className="pb-3">Enviados</th>
                  <th className="pb-3">Entregados</th>
                  <th className="pb-3">Abiertos</th>
                  <th className="pb-3">Respuestas</th>
                </tr>
              </thead>
              <tbody>
                {surveyAnalytics.distributionPerformance.map((dist) => (
                  <tr key={dist.distributionId} className="border-b border-white/5">
                    <td className="py-3 text-white">{dist.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-white/10">
                        {dist.channel}
                      </span>
                    </td>
                    <td className="py-3 text-white/70">{dist.sent}</td>
                    <td className="py-3 text-white/70">{dist.delivered} ({dist.deliveryRate?.toFixed(1)}%)</td>
                    <td className="py-3 text-white/70">{dist.opened} ({dist.openRate?.toFixed(1)}%)</td>
                    <td className="py-3 text-white/70">{dist.responded} ({dist.responseRate?.toFixed(1)}%)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

