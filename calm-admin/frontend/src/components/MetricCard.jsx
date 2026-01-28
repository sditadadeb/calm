import { CheckCircle } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  accentColor = 'emerald'
}) {
  // Colores de acento para el borde izquierdo
  const accentColors = {
    emerald: 'border-l-emerald-500',
    cyan: 'border-l-cyan-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    violet: 'border-l-violet-500',
    blue: 'border-l-blue-500',
  };

  // Colores de fondo para iconos
  const iconBgColors = {
    emerald: 'bg-emerald-500/20 text-emerald-500',
    cyan: 'bg-cyan-500/20 text-cyan-500',
    amber: 'bg-amber-500/20 text-amber-500',
    rose: 'bg-rose-500/20 text-rose-500',
    violet: 'bg-violet-500/20 text-violet-500',
    blue: 'bg-blue-500/20 text-blue-500',
  };

  // Variantes del card
  const variants = {
    default: `bg-slate-800 border-l-4 ${accentColors[accentColor]} border-slate-700`,
    success: 'bg-slate-800 border-l-4 border-l-emerald-500 border-slate-700',
    danger: 'bg-slate-800 border-l-4 border-l-rose-500 border-slate-700',
    warning: 'bg-slate-800 border-l-4 border-l-amber-500 border-slate-700',
    info: 'bg-slate-800 border-l-4 border-l-cyan-500 border-slate-700',
    primary: 'bg-gradient-to-br from-emerald-500 to-teal-600 border-0',
  };

  const isPrimary = variant === 'primary';

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl border ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-1 ${isPrimary ? 'text-white/80' : 'text-slate-400'}`}>
            {title}
          </p>
          <p className={`text-4xl font-bold tracking-tight ${isPrimary ? 'text-white' : 'text-white'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-2 ${isPrimary ? 'text-white/60' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isPrimary ? 'bg-white/20' : iconBgColors[accentColor]
          }`}>
            <Icon className={`w-7 h-7 ${isPrimary ? 'text-white' : ''}`} />
          </div>
        )}
      </div>
    </div>
  );
}
