/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains uppercase and lowercase
 * - Contains number
 * - Contains special character
 */
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar
  );
};

/**
 * Validate phone number (Indian format)
 */
export const isValidIndianPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (size: number, maxSizeInMB: number = 10): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
};

/**
 * Validate file type
 */
export const isValidFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate MBBS year (1-5)
 */
export const isValidMBBSYear = (year: number): boolean => {
  return year >= 1 && year <= 5;
};

/**
 * Validate token amount
 */
export const isValidTokenAmount = (amount: number): boolean => {
  return Number.isInteger(amount) && amount > 0;
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (page: number, limit: number): boolean => {
  return (
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page >= 1 &&
    limit >= 1 &&
    limit <= 100
  );
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate CUID format
 */
export const isValidCuid = (id: string): boolean => {
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
};
