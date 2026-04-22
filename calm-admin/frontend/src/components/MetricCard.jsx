import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = 'default' }) {
  const { isDark } = useTheme();

  const variants = {
    default: isDark
      ? 'bg-slate-900 border-l-[3px] border-l-[#0081FF] border border-slate-700'
      : 'bg-white border-l-[3px] border-l-[#0081FF] border border-gray-200',
    primary: 'bg-[#0081FF] text-white border-0',
    success: isDark
      ? 'bg-slate-900 border-l-[3px] border-l-[#26C16E] border border-slate-700'
      : 'bg-white border-l-[3px] border-l-[#26C16E] border border-gray-200',
    danger: isDark
      ? 'bg-slate-900 border-l-[3px] border-l-[#ef4444] border border-slate-700'
      : 'bg-white border-l-[3px] border-l-[#ef4444] border border-gray-200',
    warning: isDark
      ? 'bg-slate-900 border-l-[3px] border-l-[#FFD008] border border-slate-700'
      : 'bg-white border-l-[3px] border-l-[#FFD008] border border-gray-200',
  };

  const iconBg = {
    default: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-[#EBF5FF] text-[#0081FF]',
    primary: 'bg-white/20 text-white',
    success: isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-[#26C16E]',
    danger:  isDark ? 'bg-red-500/10  text-red-400'   : 'bg-red-50  text-red-500',
    warning: isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600',
  };

  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-xl p-5 transition-all hover:shadow-md hover:-translate-y-px ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${isPrimary ? 'text-white/70' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-1.5 ${isPrimary ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isPrimary ? 'text-white/60' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl flex-shrink-0 ${iconBg[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1.5 mt-4 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          {trend === 'up'   && <TrendingUp   className="w-3.5 h-3.5 text-[#26C16E]" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-[#26C16E]' : 'text-red-400'}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
