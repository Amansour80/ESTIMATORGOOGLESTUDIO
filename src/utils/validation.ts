export const validateNumber = (
  value: number,
  min: number = 0,
  max: number = Infinity,
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } => {
  if (isNaN(value) || !isFinite(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (value > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }
  return { isValid: true };
};

export const validatePositive = (value: number, fieldName: string = 'Value'): { isValid: boolean; error?: string } => {
  return validateNumber(value, 0, Infinity, fieldName);
};

export const validateRequired = (value: string, fieldName: string = 'Field'): { isValid: boolean; error?: string } => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
};

export const validatePercentage = (value: number, fieldName: string = 'Percentage'): { isValid: boolean; error?: string } => {
  return validateNumber(value, 0, 100, fieldName);
};

export const sanitizeNumber = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return num;
};

export const clampNumber = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const validateCurrency = (value: number, fieldName: string = 'Amount'): { isValid: boolean; error?: string } => {
  if (value < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }
  if (!isFinite(value)) {
    return { isValid: false, error: `${fieldName} must be a valid amount` };
  }
  return { isValid: true };
};

export const validateInteger = (value: number, fieldName: string = 'Value'): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(value)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }
  return { isValid: true };
};
