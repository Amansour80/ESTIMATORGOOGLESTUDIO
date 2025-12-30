import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidatedInputProps {
  type: 'text' | 'number';
  value: string | number;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  validate?: (value: any) => { isValid: boolean; error?: string };
  className?: string;
  disabled?: boolean;
}

export default function ValidatedInput({
  type,
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  step,
  required,
  validate,
  className = '',
  disabled = false,
}: ValidatedInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched && validate) {
      const result = validate(value);
      setError(result.isValid ? null : result.error || null);
    }
  }, [value, touched, validate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;

    if (type === 'number' && typeof newValue === 'number') {
      if (min !== undefined && newValue < min) {
        onChange(min);
        return;
      }
      if (max !== undefined && newValue > max) {
        onChange(max);
        return;
      }
    }

    onChange(newValue);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validate) {
      const result = validate(value);
      setError(result.isValid ? null : result.error || null);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error && touched ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {error && touched && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      {error && touched && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
