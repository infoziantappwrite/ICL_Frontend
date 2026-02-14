const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  disabled = false,
  helpText = "",
  pattern = "",
  min = "",
  max = "",
  minLength = "",
  maxLength = "",
  options = [],
  className = ""
}) => {
  const baseInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const disabledClass = disabled ? "bg-gray-50 cursor-not-allowed" : "";
  const fullClassName = `${baseInputClass} ${disabledClass} ${className}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={fullClassName}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          minLength={minLength}
          maxLength={maxLength}
          className={fullClassName}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          pattern={pattern}
          min={min}
          max={max}
          minLength={minLength}
          maxLength={maxLength}
          className={fullClassName}
        />
      )}
      
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;