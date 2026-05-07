import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
            error ? 'border-red-300' : 'border-gray-200'
          } rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-transparent transition-all duration-200`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(13,43,140,0.12), 0 1px 3px rgba(0,0,0,0.06)'; e.target.style.borderColor = '#0d2b8c'; }}
          onBlur={e => { e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.target.style.borderColor = error ? '#fca5a5' : '#e5e7eb'; }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#0d2b8c] transition-colors"
        >
          {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
