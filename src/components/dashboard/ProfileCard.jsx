const ProfileCard = ({ 
  title, 
  icon: Icon, 
  children, 
  headerAction,
  className = '' 
}) => {
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden ${className}`}>
      {/* Card Header */}
      {(title || Icon || headerAction) && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            {title && (
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            )}
          </div>
          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default ProfileCard;
