import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function ScoreBadge({ score, size = 'default' }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  if (score === null || score === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  const getScoreColor = (score) => {
    if (score >= 9) return { text: isDark ? 'text-emerald-300' : 'text-emerald-600', bar: 'bg-emerald-400' };
    if (score >= 7) return { text: isDark ? 'text-emerald-300' : 'text-emerald-600', bar: 'bg-emerald-400' };
    if (score >= 5) return { text: isDark ? 'text-yellow-300' : 'text-yellow-600', bar: 'bg-yellow-400' };
    if (score >= 3) return { text: isDark ? 'text-orange-300' : 'text-orange-600', bar: 'bg-orange-400' };
    return { text: isDark ? 'text-red-400' : 'text-red-500', bar: 'bg-red-400' };
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return t('score.excellent');
    if (score >= 7) return t('score.good');
    if (score >= 5) return t('score.regular');
    if (score >= 3) return t('score.low');
    return t('score.critical');
  };

  const colors = getScoreColor(score);

  // Número + barra fina en horizontal, como en la maqueta
  if (size === 'small') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className={`font-display text-sm font-semibold tabular-nums w-[18px] ${colors.text}`}>
          {score}
        </span>
        <div className={`h-[3px] w-[52px] rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${score * 10}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`font-display text-2xl font-semibold tabular-nums ${colors.text}`}>{score}</span>
      <div>
        <p className={`text-sm font-medium ${colors.text}`}>{getScoreLabel(score)}</p>
        <div className={`w-20 h-[3px] rounded-full mt-1.5 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div 
            className={`h-full rounded-full ${colors.bar} transition-all`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}
