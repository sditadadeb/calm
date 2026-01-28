import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = 'default' 
}) {
  // Variantes con estilo oscuro
  const variants = {
    default: 'bg-slate-800 border-l-4 border-l-emerald-500 border border-slate-700',
    primary: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0',
    success: 'bg-slate-800 border-l-4 border-l-green-500 border border-slate-700',
    danger: 'bg-slate-800 border-l-4 border-l-red-500 border border-slate-700',
    warning: 'bg-slate-800 border-l-4 border-l-amber-500 border border-slate-700',
  };

  const iconBg = {
    default: 'bg-emerald-500/20 text-emerald-400',
    primary: 'bg-white/20 text-white',
    success: 'bg-green-500/20 text-green-400',
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-amber-500/20 text-amber-400',
  };

  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-2xl p-6 transition-all hover:shadow-lg hover:translate-y-[-2px] ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isPrimary ? 'text-white/70' : 'text-slate-400'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${isPrimary ? 'text-white' : 'text-white'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${isPrimary ? 'text-white/60' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
