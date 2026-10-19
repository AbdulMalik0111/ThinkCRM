import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * ThinkCRM Shared Validation Utilities
 * JavaScript & JSX only. Consistent rules across all forms.
 */

/**
 * Validates a phone number with country code.
 * Default is India ('IN', +91).
 * Standard Indian cellular mobile: 10 digits starting with 6, 7, 8, or 9.
 *
 * @param {string} phone - Can be combined (+91 9876543210) or national number (9876543210)
 * @param {object} options
 * @param {string} options.country - Default country code ('IN')
 * @param {boolean} options.required - Whether the field is mandatory
 * @returns {{ isValid: boolean, error: string|null, formatted: string, nationalNumber: string, country: string }}
 */
export const validatePhone = (phone, { country = 'IN', required = true } = {}) => {
  const raw = (phone || '').toString().trim();

  if (!raw) {
    if (required) {
      return {
        isValid: false,
        error: 'Phone number is required',
        formatted: '',
        nationalNumber: '',
        country,
      };
    }
    return {
      isValid: true,
      error: null,
      formatted: '',
      nationalNumber: '',
      country,
    };
  }

  // Parse with libphonenumber-js
  const parsed = parsePhoneNumberFromString(raw, country);

  if (!parsed) {
    const digits = raw.replace(/\D/g, '');
    if (country === 'IN' && digits.length === 10) {
      const startsWithValid = /^[6-9]/.test(digits);
      if (startsWithValid) {
        return {
          isValid: true,
          error: null,
          formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
          nationalNumber: digits,
          country: 'IN',
        };
      }
    }
    return {
      isValid: false,
      error: country === 'IN' ? 'Enter a valid 10-digit Indian mobile number' : 'Please enter a valid phone number',
      formatted: raw,
      nationalNumber: digits,
      country,
    };
  }

  const detectedCountry = parsed.country || country;
  const nationalNumber = parsed.nationalNumber;

  if (detectedCountry === 'IN') {
    const isIndianMobile = /^[6-9]\d{9}$/.test(nationalNumber);
    if (!isIndianMobile) {
      return {
        isValid: false,
        error: 'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
        formatted: parsed.formatInternational() || raw,
        nationalNumber,
        country: 'IN',
      };
    }
  } else {
    if (!parsed.isValid()) {
      return {
        isValid: false,
        error: `Please enter a valid phone number for ${detectedCountry}`,
        formatted: raw,
        nationalNumber,
        country: detectedCountry,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    formatted: parsed.formatInternational(),
    nationalNumber,
    country: detectedCountry,
  };
};

/**
 * Validates an email address.
 *
 * @param {string} email
 * @param {object} options
 * @param {boolean} options.required
 * @param {string} options.fieldName
 * @returns {{ isValid: boolean, error: string|null, value: string }}
 */
export const validateEmail = (email, { required = false, fieldName = 'Email' } = {}) => {
  const raw = (email || '').toString().trim();

  if (!raw) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required`, value: '' };
    }
    return { isValid: true, error: null, value: '' };
  }

  // Prevent accidental internal spaces: "john @example.com"
  if (/\s/.test(raw)) {
    return { isValid: false, error: 'Email address cannot contain spaces', value: raw };
  }

  // RFC standard format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(raw)) {
    return { isValid: false, error: 'Enter a valid email address (e.g. name@example.com)', value: raw };
  }

  return { isValid: true, error: null, value: raw.toLowerCase() };
};

/**
 * Validates a text/name field.
 * Allows legitimate Unicode, Indian names, accents, and valid punctuation.
 *
 * @param {string} text
 * @param {object} options
 * @returns {{ isValid: boolean, error: string|null, value: string }}
 */
export const validateText = (
  text,
  {
    required = true,
    fieldName = 'Field',
    min = 2,
    max = 100,
    allowSpecialChars = false,
  } = {}
) => {
  const raw = (text || '').toString().trim().replace(/\s+/g, ' ');

  if (!raw) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required`, value: '' };
    }
    return { isValid: true, error: null, value: '' };
  }

  if (raw.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters`,
      value: raw,
    };
  }

  if (raw.length > max) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${max} characters`,
      value: raw,
    };
  }

  // If this is a name field, ensure it doesn't consist of pure symbols/numbers
  if (!allowSpecialChars && fieldName.toLowerCase().includes('name')) {
    // Must contain at least one letter (Unicode letters supported)
    if (!/\p{L}/u.test(raw)) {
      return {
        isValid: false,
        error: `${fieldName} must contain valid letters`,
        value: raw,
      };
    }
  }

  return { isValid: true, error: null, value: raw };
};

/**
 * Validates numeric fields (Budget, Quantity, Amount, Discount, etc.)
 *
 * @param {string|number} value
 * @param {object} options
 * @returns {{ isValid: boolean, error: string|null, value: number|null }}
 */
export const validateNumber = (
  value,
  {
    required = false,
    fieldName = 'Amount',
    min = 0,
    max = Infinity,
    integer = false,
  } = {}
) => {
  if (value === '' || value === null || value === undefined) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required`, value: null };
    }
    return { isValid: true, error: null, value: null };
  }

  // Remove currency symbols or commas if typed/pasted
  const cleanStr = String(value).replace(/[₹$,]/g, '').trim();
  const num = Number(cleanStr);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number`, value: null };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number`, value: null };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} cannot be less than ${min}`, value: null };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}`, value: null };
  }

  return { isValid: true, error: null, value: num };
};

/**
 * Validates date and time fields.
 *
 * @param {string|Date} date
 * @param {object} options
 * @returns {{ isValid: boolean, error: string|null, value: string }}
 */
export const validateDate = (
  date,
  {
    required = true,
    fieldName = 'Date',
    allowPast = true,
    mustBeFuture = false,
  } = {}
) => {
  if (!date) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required`, value: '' };
    }
    return { isValid: true, error: null, value: '' };
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return { isValid: false, error: `Please enter a valid ${fieldName}`, value: '' };
  }

  if (mustBeFuture) {
    const now = new Date();
    // Allow a grace window of 2 minutes for immediate scheduling
    if (parsed.getTime() < now.getTime() - 2 * 60 * 1000) {
      return { isValid: false, error: `${fieldName} must be in the future`, value: '' };
    }
  }

  return { isValid: true, error: null, value: parsed.toISOString() };
};

/**
 * Focuses the first invalid input on the screen.
 *
 * @param {object} errors - Object mapping field names to error messages
 * @param {Array<string>} fieldOrder - Array of field names in display order
 */
export const focusFirstError = (errors, fieldOrder = []) => {
  if (!errors || Object.keys(errors).length === 0) return;

  const errorKeys = Object.keys(errors).filter((k) => Boolean(errors[k]));
  if (errorKeys.length === 0) return;

  let targetField = errorKeys[0];
  if (Array.isArray(fieldOrder) && fieldOrder.length > 0) {
    for (const f of fieldOrder) {
      if (errors[f]) {
        targetField = f;
        break;
      }
    }
  }

  const el =
    document.querySelector(`[name="${targetField}"]`) ||
    document.querySelector(`#${targetField}`) ||
    document.querySelector(`[data-field="${targetField}"]`);

  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 100);
    }
  }
};
