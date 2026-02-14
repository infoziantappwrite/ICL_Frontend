const StatsCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color = 'blue',
  onClick
}) => {
  const colorClasses = {
    blue:   'from-blue-600 to-cyan-600',
    green:  'from-green-600 to-emerald-600',
    purple: 'from-purple-600 to-pink-600',
    orange: 'from-orange-500 to-red-500',
    indigo: 'from-indigo-600 to-blue-600',
  };

  const trendColors = {
    up:   'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    flat: 'text-gray-600 bg-gray-50',
  };

  const trendIcons = {
    up:   '↑',
    down: '↓',
    flat: '→',
  };

  const gradientClass = colorClasses[color] || colorClasses.blue;
  const trendColorClass = trendColors[trend] || trendColors.flat;
  const trendIcon = trendIcons[trend] || '';

  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {(trend || trendValue) && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trendColorClass}`}>
              {trend && <span>{trendIcon}</span>}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-14 h-14 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-4`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;