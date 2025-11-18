/**
 * Date utility functions
 */

/**
 * Get current date/time as ISO string
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add months to a date
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Add years to a date
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Calculate subscription end date based on billing cycle
 */
export const calculateSubscriptionEndDate = (
  startDate: Date,
  billingCycle: string
): Date => {
  switch (billingCycle.toLowerCase()) {
    case 'monthly':
      return addMonths(startDate, 1);
    case 'quarterly':
      return addMonths(startDate, 3);
    case 'yearly':
    case 'annual':
      return addYears(startDate, 1);
    default:
      return addMonths(startDate, 1);
  }
};

/**
 * Check if date is expired
 */
export const isExpired = (date: Date): boolean => {
  return new Date(date) < new Date();
};

/**
 * Get days until date
 */
export const getDaysUntil = (date: Date): number => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
