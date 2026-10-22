import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js';
import Icon from '@/components/ui/Icon';
import { validatePhone } from '@/utils/validation';

// Curated list of popular country codes with India as default
const POPULAR_COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
];

/**
 * Splits any raw phone string into country code and national number.
 * Safely prevents duplicate country codes (e.g. +91 +91).
 */
const splitPhoneValue = (raw, defaultCountry = 'IN') => {
  if (!raw) return { country: defaultCountry, nationalNumber: '' };

  const str = String(raw).trim();

  // If phone string starts with +91
  if (str.startsWith('+91')) {
    let clean = str.replace(/^\+91[\s-]*/, '').replace(/\D/g, '');
    if (clean.length > 10 && clean.startsWith('91')) {
      clean = clean.slice(2);
    }
    return { country: 'IN', nationalNumber: clean.slice(0, 10) };
  }

  const cleanDigits = str.replace(/\D/g, '');

  if (defaultCountry === 'IN' || (cleanDigits.length >= 11 && (cleanDigits.startsWith('91') || cleanDigits.startsWith('0')))) {
    let nat = cleanDigits;
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
      nat = cleanDigits.slice(2);
    } else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
      nat = cleanDigits.slice(1);
    } else if (cleanDigits.length > 10 && cleanDigits.startsWith('91')) {
      nat = cleanDigits.slice(2);
    }
    return { country: 'IN', nationalNumber: nat.slice(0, 10) };
  }

  const parsed = parsePhoneNumberFromString(str, defaultCountry);
  if (parsed) {
    const c = parsed.country || defaultCountry;
    let num = parsed.nationalNumber || '';
    if (c === 'IN') {
      if (num.length > 10 && num.startsWith('91')) {
        num = num.slice(2);
      }
      num = num.slice(0, 10);
    }
    return {
      country: c,
      nationalNumber: num,
    };
  }

  if (str.startsWith('+1')) {
    return { country: 'US', nationalNumber: cleanDigits.replace(/^1/, '') };
  }
  if (str.startsWith('+44')) {
    return { country: 'GB', nationalNumber: cleanDigits.replace(/^44/, '') };
  }

  return { country: defaultCountry, nationalNumber: cleanDigits.slice(-10) };
};

const PhoneInputWithCountry = ({
  label = 'Phone Number',
  value = '',
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = 'Enter 10-digit mobile number',
  name = 'phone',
  id,
  className = '',
  helperText,
}) => {
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [nationalNumber, setNationalNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const { country, nationalNumber: num } = splitPhoneValue(value, selectedCountry || 'IN');
    setSelectedCountry(country);
    setNationalNumber(num);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCountry = useMemo(() => {
    const found = POPULAR_COUNTRIES.find((c) => c.code === selectedCountry);
    if (found) return found;
    try {
      const dial = `+${getCountryCallingCode(selectedCountry)}`;
      return { code: selectedCountry, name: selectedCountry, dialCode: dial, flag: '🌐' };
    } catch {
      return { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' };
    }
  }, [selectedCountry]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const emitChange = (countryCode, num) => {
    let cleanNum = (num || '').toString().replace(/\D/g, '');

    // For India (+91), strip any leading 91 or 0 if more than 10 digits
    if (countryCode === 'IN') {
      if (cleanNum.length === 12 && cleanNum.startsWith('91')) {
        cleanNum = cleanNum.slice(2);
      } else if (cleanNum.length === 11 && cleanNum.startsWith('0')) {
        cleanNum = cleanNum.slice(1);
      } else if (cleanNum.length > 10 && cleanNum.startsWith('91')) {
        cleanNum = cleanNum.slice(2);
      } else if (cleanNum.length > 10) {
        cleanNum = cleanNum.slice(0, 10);
      }
    }

    // Do NOT prepend +91 for India because +91 is already in the UI country dropdown prefix!
    let emittedVal = cleanNum;
    if (cleanNum && countryCode !== 'IN') {
      try {
        const dial = `+${getCountryCallingCode(countryCode)}`;
        emittedVal = `${dial} ${cleanNum}`;
      } catch {
        emittedVal = cleanNum;
      }
    }

    const validation = validatePhone(emittedVal, { country: countryCode, required });

    if (onChange) {
      onChange(emittedVal, {
        countryCode,
        nationalNumber: cleanNum,
        combined: emittedVal,
        isValid: validation.isValid,
        error: validation.error,
      });
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country.code);
    setIsDropdownOpen(false);
    setSearchQuery('');
    emitChange(country.code, nationalNumber);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    let rawVal = e.target.value;

    // Check if the user pasted an international phone with leading +
    if (rawVal.includes('+')) {
      const parsed = parsePhoneNumberFromString(rawVal, selectedCountry);
      if (parsed) {
        const newCountry = parsed.country || selectedCountry;
        let newNum = parsed.nationalNumber;
        if (newCountry === 'IN' && newNum.length > 10 && newNum.startsWith('91')) {
          newNum = newNum.slice(2);
        }
        setSelectedCountry(newCountry);
        setNationalNumber(newNum);
        emitChange(newCountry, newNum);
        return;
      }
    }

    // Strip non-digits
    let digits = rawVal.replace(/\D/g, '');

    // For Indian mobile numbers, cap at 10 digits and strip leading 91
    if (selectedCountry === 'IN') {
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      } else if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length > 10) {
        digits = digits.slice(0, 10);
      }
    }

    setNationalNumber(digits);
    emitChange(selectedCountry, digits);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && (pasted.includes('+') || pasted.replace(/\D/g, '').length > 10)) {
      e.preventDefault();
      const parsed = parsePhoneNumberFromString(pasted, selectedCountry);
      if (parsed) {
        const newCountry = parsed.country || selectedCountry;
        let newNum = parsed.nationalNumber;
        if (newCountry === 'IN' && newNum.length > 10 && newNum.startsWith('91')) {
          newNum = newNum.slice(2);
        }
        setSelectedCountry(newCountry);
        setNationalNumber(newNum);
        emitChange(newCountry, newNum);
      } else {
        let clean = pasted.replace(/\D/g, '');
        if (clean.length === 12 && clean.startsWith('91')) clean = clean.slice(2);
        else if (clean.length === 11 && clean.startsWith('0')) clean = clean.slice(1);
        else if (clean.length > 10) clean = clean.slice(-10);
        setNationalNumber(clean);
        emitChange(selectedCountry, clean);
      }
    }
  };

  const inputId = id || `phone-input-${name}`;

  return (
    <div className={`w-full font-inter ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-lg border transition ${
          error
            ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/10'
            : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        } bg-white dark:bg-slate-900 ${disabled ? 'opacity-60 bg-slate-50 dark:bg-slate-800 cursor-not-allowed' : ''}`}
      >
        {/* Country Code Selector Trigger */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-r border-slate-200 dark:border-slate-700 rounded-l-lg transition focus:outline-none"
            aria-label="Select Country Code"
          >
            <span className="text-base select-none leading-none">{currentCountry.flag}</span>
            <span className="font-semibold">{currentCountry.dialCode}</span>
            <Icon icon="heroicons-outline:chevron-down" className="text-xs text-slate-400" />
          </button>

          {/* Country Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 animate-fadeIn">
              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="py-1">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-blue-50 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 transition ${
                      c.code === selectedCountry ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="text-slate-400 font-semibold flex-shrink-0 ml-2">{c.dialCode}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400">No country found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* National Number Input */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          placeholder={selectedCountry === 'IN' ? 'Enter 10-digit mobile number' : placeholder}
          className="flex-1 w-full px-3 py-2 text-[13.5px] bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none font-inter"
          data-field={name}
        />

        {/* Clear Button */}
        {nationalNumber && !disabled && (
          <button
            type="button"
            onClick={() => {
              setNationalNumber('');
              emitChange(selectedCountry, '');
              if (inputRef.current) inputRef.current.focus();
            }}
            className="mr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Clear number"
          >
            <Icon icon="heroicons-outline:x-circle" className="text-base" />
          </button>
        )}
      </div>

      {/* Field Error Message */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500 font-medium mt-1 animate-fadeIn">
          <Icon icon="heroicons-outline:exclamation-circle" className="text-xs flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper text if no error */}
      {!error && helperText && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default PhoneInputWithCountry;
