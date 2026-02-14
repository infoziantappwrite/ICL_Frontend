import { Plus, X } from 'lucide-react';

const SkillInput = ({
  label,
  skills,
  newSkill,
  setNewSkill,
  onAddSkill,
  onRemoveSkill,
  required = false,
  placeholder = "Enter skill and press Enter or click Add",
  skillColor = "blue"
}) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:text-blue-900', button: 'bg-blue-600 hover:bg-blue-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700', hover: 'hover:text-green-900', button: 'bg-green-600 hover:bg-green-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:text-purple-900', button: 'bg-purple-600 hover:bg-purple-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:text-orange-900', button: 'bg-orange-600 hover:bg-orange-700' }
  };

  const colors = colorClasses[skillColor] || colorClasses.blue;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddSkill();
            }
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onAddSkill}
          className={`px-4 py-2 ${colors.button} text-white rounded-lg transition-colors`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-2 px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm`}
          >
            {skill}
            <button
              type="button"
              onClick={() => onRemoveSkill(index)}
              className={colors.hover}
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
      
      {required && skills.length === 0 && (
        <p className="text-xs text-red-500 mt-1">At least one {label.toLowerCase()} is required</p>
      )}
    </div>
  );
};

export default SkillInput;