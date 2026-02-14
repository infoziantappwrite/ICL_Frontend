const InfoRow = ({ 
  icon: Icon, 
  label, 
  value, 
  badge,
  className = '' 
}) => {
  return (
    <div className={`flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0 ${className}`}>
      {Icon && (
        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-base text-gray-900 font-medium">
            {value || <span className="text-gray-400 italic">Not specified</span>}
          </p>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoRow;
