import { X } from 'lucide-react';

const SkillBadge = ({ 
  skill, 
  onRemove, 
  color = 'blue',
  size = 'md' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        colorClasses[color]
      } ${sizeClasses[size]} transition-all duration-200 hover:shadow-md`}
    >
      {skill}
      {onRemove && (
        <button
          onClick={() => onRemove(skill)}
          className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default SkillBadge;
