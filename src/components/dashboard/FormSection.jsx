import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FormSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isActive = false,
  onClick,
  collapsible = false,
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClick = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
      <button
        onClick={handleClick}
        className={`w-full px-6 py-4 flex items-center justify-between ${
          isActive ? 'bg-gradient-to-r from-blue-50 to-cyan-50' : ''
        } ${onClick || collapsible ? 'cursor-pointer hover:bg-blue-50/50' : 'cursor-default'} transition-colors`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isActive 
                ? 'bg-gradient-to-br from-blue-600 to-cyan-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {collapsible && (
          isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 py-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection;
