const ProgressBar = ({ 
  percentage = 0, 
  label, 
  showPercentage = true,
  size = 'md',
  color = 'blue' 
}) => {
  const getColorClass = () => {
    if (color !== 'blue') {
      const colorMap = {
        green: 'from-green-500 to-emerald-600',
        yellow: 'from-yellow-500 to-orange-500',
        red: 'from-red-500 to-pink-600',
        purple: 'from-purple-500 to-pink-500',
      };
      return colorMap[color] || 'from-blue-500 to-cyan-600';
    }

    // Auto color based on percentage
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  const getStatus = () => {
    if (percentage >= 80) return { text: 'Excellent', icon: '🎉' };
    if (percentage >= 50) return { text: 'Good Progress', icon: '👍' };
    return { text: 'Needs Attention', icon: '⚠️' };
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const status = getStatus();

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {status.icon} {percentage}% - {status.text}
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} bg-gradient-to-r ${getColorClass()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
