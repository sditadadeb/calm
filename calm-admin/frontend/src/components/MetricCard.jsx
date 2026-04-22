import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = 'default' 
}) {
  const { isDark } = useTheme();
  
  // Variantes con colores Banco de Occidente
  const variants = {
    default: isDark 
      ? 'bg-slate-800 border-l-4 border-l-[#0081FF] border border-slate-700'
      : 'bg-white border-l-4 border-l-[#0081FF] border border-gray-200',
    primary: 'bg-gradient-to-br from-[#0862C5] to-[#0081FF] text-white border-0',
    success: isDark 
      ? 'bg-slate-800 border-l-4 border-l-[#26C16E] border border-slate-700'
      : 'bg-white border-l-4 border-l-[#26C16E] border border-gray-200',
    danger: isDark 
      ? 'bg-slate-800 border-l-4 border-l-[#E70518] border border-slate-700'
      : 'bg-white border-l-4 border-l-[#E70518] border border-gray-200',
    warning: isDark 
      ? 'bg-slate-800 border-l-4 border-l-[#FFD008] border border-slate-700'
      : 'bg-white border-l-4 border-l-[#FFD008] border border-gray-200',
  };

  const iconBg = {
    default: 'bg-[#0081FF]/15 text-[#0081FF]',
    primary: 'bg-white/20 text-white',
    success: 'bg-[#26C16E]/15 text-[#26C16E]',
    danger:  'bg-[#E70518]/10 text-[#E70518]',
    warning: 'bg-[#FFD008]/20 text-[#b38a00]',
  };

  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-xl p-6 transition-all hover:shadow-md hover:translate-y-[-1px] ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${isPrimary ? 'text-white/70' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${isPrimary ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${isPrimary ? 'text-white/60' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
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
        <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-[#26C16E]" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-[#E70518]" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-[#26C16E]' : 'text-[#E70518]'
          }`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
