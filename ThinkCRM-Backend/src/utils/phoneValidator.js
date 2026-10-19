import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

const DIAL_CODE_TO_ISO = {
  '+91': 'IN',
  '91': 'IN',
  '+1': 'US',
  '1': 'US',
  '+44': 'GB',
  '44': 'GB',
  '+971': 'AE',
  '971': 'AE',
  '+61': 'AU',
  '61': 'AU',
  '+65': 'SG',
  '65': 'SG',
  '+1': 'CA',
  'CA': 'CA',
};

/**
 * Validates and normalizes phone numbers.
 * Default country is 'IN' (+91).
 * For India: validates 10-digit mobile number starting with 6, 7, 8, or 9.
 * For other countries: uses libphonenumber-js validation.
 *
 * @param {string} rawPhone - Raw phone string (may include +91, spaces, dashes, etc.)
 * @param {string} defaultCountry - ISO country code default (e.g. 'IN') or dial code ('+91')
 * @returns {{ isValid: boolean, error: string|null, canonical: string, formatted: string, e164: string, country: string, nationalNumber: string }}
 */
export const validateAndNormalizePhone = (rawPhone, defaultCountry = 'IN') => {
  const isoCountry = DIAL_CODE_TO_ISO[defaultCountry] || (defaultCountry.length === 2 ? defaultCountry.toUpperCase() : 'IN');

  if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required',
      canonical: '',
      formatted: '',
      e164: '',
      country: isoCountry,
      nationalNumber: '',
    };
  }

  const clean = rawPhone.trim();

  // Try parsing with libphonenumber-js
  const parsed = parsePhoneNumberFromString(clean, isoCountry);

  if (!parsed) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number',
      canonical: clean.replace(/\D/g, ''),
      formatted: clean,
      e164: clean.replace(/\D/g, ''),
      country: isoCountry,
      nationalNumber: clean.replace(/\D/g, ''),
    };
  }

  const country = parsed.country || isoCountry;
  const nationalNumber = parsed.nationalNumber;
  const e164 = parsed.format('E.164');

  // Specific Indian mobile numbering check (TRAI rule: mobile begins with 6, 7, 8, or 9)
  if (country === 'IN') {
    const isIndianMobile = /^[6-9]\d{9}$/.test(nationalNumber);
    if (!isIndianMobile) {
      return {
        isValid: false,
        error: 'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)',
        canonical: nationalNumber,
        formatted: parsed.formatInternational() || clean,
        e164,
        country: 'IN',
        nationalNumber,
      };
    }
  } else {
    if (!parsed.isValid()) {
      return {
        isValid: false,
        error: `Please enter a valid phone number for ${country}`,
        canonical: nationalNumber,
        formatted: clean,
        e164,
        country,
        nationalNumber,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    canonical: nationalNumber,
    formatted: parsed.formatInternational(),
    e164,
    country,
    nationalNumber,
  };
};

/**
 * Zod refinement helper for phone fields
 */
export const isValidPhoneString = (val) => {
  if (!val || typeof val !== 'string') return false;
  const res = validateAndNormalizePhone(val, 'IN');
  return res.isValid;
};
