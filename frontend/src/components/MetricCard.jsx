import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  infoText,
  icon: Icon, 
  trend, 
  trendValue,
  variant = 'default' 
}) {
  const { isDark } = useTheme();
  
  // Variantes con colores Carrefour
  const variants = {
    default: isDark 
      ? 'bg-zinc-950 border-l-4 border-l-white border border-zinc-700 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
      : 'bg-white border-l-4 border-l-[#004F9F] border border-gray-200',
    primary: 'bg-gradient-to-br from-[#004F9F] to-[#003A79] text-white border-0',
    success: isDark 
      ? 'bg-zinc-950 border-l-4 border-l-green-400 border border-zinc-700 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]'
      : 'bg-white border-l-4 border-l-green-500 border border-gray-200',
    danger: isDark 
      ? 'bg-zinc-950 border-l-4 border-l-red-400 border border-zinc-700 shadow-[0_0_0_1px_rgba(248,113,113,0.16)]'
      : 'bg-white border-l-4 border-l-red-500 border border-gray-200',
    warning: isDark 
      ? 'bg-zinc-950 border-l-4 border-l-amber-400 border border-zinc-700 shadow-[0_0_0_1px_rgba(251,191,36,0.14)]'
      : 'bg-white border-l-4 border-l-amber-500 border border-gray-200',
  };

  const iconBg = {
    default: isDark ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-[#004F9F]/20 text-[#004F9F]',
    primary: 'bg-white/20 text-white',
    success: isDark ? 'bg-green-500/25 text-green-300 ring-1 ring-green-300/25' : 'bg-green-500/20 text-green-500',
    danger: isDark ? 'bg-red-500/25 text-red-300 ring-1 ring-red-300/25' : 'bg-red-500/20 text-red-500',
    warning: isDark ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-300/25' : 'bg-amber-500/20 text-amber-500',
  };

  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-2xl p-6 transition-all hover:shadow-xl hover:translate-y-[-2px] ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold tracking-wide ${isPrimary ? 'text-white/80' : isDark ? 'text-zinc-300' : 'text-gray-500'}`}>
              {title}
            </p>
            {infoText && (
              <span
                title={infoText}
                className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-xs font-bold cursor-help ${
                  isPrimary
                    ? 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                i
              </span>
            )}
          </div>
          <p className={`text-4xl leading-none font-extrabold mt-2 ${isPrimary ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-2 ${isPrimary ? 'text-white/70' : isDark ? 'text-zinc-300/90' : 'text-gray-400'}`}>
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
        <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
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
