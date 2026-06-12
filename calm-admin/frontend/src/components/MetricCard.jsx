import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Celda de KPI: pensada para vivir dentro de una franja única con divisores
// (ver Dashboard). El color del valor es el único acento por variante.
export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = 'default',
  to,
}) {
  const { isDark } = useTheme();
  
  const valueColor = {
    default: isDark ? 'text-white' : 'text-gray-900',
    primary: 'text-[#F5A623]',
    success: 'text-emerald-400',
    danger: 'text-red-400',
    warning: 'text-[#F5A623]',
  }[variant];

  const cell = (
    <div className={`px-5 py-4 h-full transition-colors ${to ? 'cursor-pointer ' + (isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50') : ''}`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} strokeWidth={1.8} />}
        <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {title}
        </p>
      </div>
      <p className={`font-display text-[28px] font-semibold leading-tight mt-2 tabular-nums ${valueColor}`}>
        {value}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        {subtitle && (
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {subtitle}
          </p>
        )}
        {trend !== undefined && (
          <span className={`text-xs font-medium inline-flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{cell}</Link>;
  }
  return cell;
}
