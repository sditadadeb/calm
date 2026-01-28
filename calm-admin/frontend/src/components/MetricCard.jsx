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
  const variants = {
    default: 'bg-white border border-gray-100',
    primary: 'bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] text-white border-0 shadow-lg',
    success: 'bg-white border-l-4 border-l-emerald-500 border-y border-r border-gray-100',
    danger: 'bg-white border-l-4 border-l-red-500 border-y border-r border-gray-100',
    warning: 'bg-white border-l-4 border-l-[#2d5a87] border-y border-r border-gray-100',
  };

  const iconBg = {
    default: 'bg-slate-100 text-[#1e3a5f]',
    primary: 'bg-white/15 text-white',
    success: 'bg-emerald-100 text-emerald-600',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-slate-100 text-[#1e3a5f]',
  };

  return (
    <div className={`rounded-[20px] p-6 transition-all hover:shadow-lg ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'primary' ? 'text-white/70' : 'text-gray-500'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${variant === 'primary' ? 'text-white' : 'text-[#1e3a5f]'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${variant === 'primary' ? 'text-white/60' : 'text-gray-400'}`}>
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
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
