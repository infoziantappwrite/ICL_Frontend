import { AlertCircle } from 'lucide-react';

const InputField = ({
  label,
  icon: Icon,
  type = 'text',
  name,
  autoComplete,
  value,
  onChange,
  placeholder,
  error
}) => {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 bg-white border ${
            error ? 'border-red-300' : 'border-gray-200'
          } rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(13,43,140,0.12), 0 1px 3px rgba(0,0,0,0.06)'; e.target.style.borderColor = '#0d2b8c'; }}
          onBlur={e => { e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.target.style.borderColor = error ? '#fca5a5' : '#e5e7eb'; }}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;