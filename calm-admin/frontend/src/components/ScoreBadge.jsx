export default function ScoreBadge({ score, size = 'default' }) {
  if (score === null || score === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  const getScoreColor = (score) => {
    if (score >= 9) return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' };
    if (score >= 7) return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' };
    if (score >= 5) return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' };
    if (score >= 3) return { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' };
    return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' };
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Excelente';
    if (score >= 7) return 'Bueno';
    if (score >= 5) return 'Regular';
    if (score >= 3) return 'Bajo';
    return 'Crítico';
  };

  const colors = getScoreColor(score);

  if (size === 'small') {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text}`}>
        {score}/10
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
        <span className={`text-xl font-bold ${colors.text}`}>{score}</span>
      </div>
      <div>
        <p className={`text-sm font-semibold ${colors.text}`}>{getScoreLabel(score)}</p>
        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full rounded-full ${colors.bar} transition-all`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}
