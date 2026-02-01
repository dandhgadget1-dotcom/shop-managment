import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format Pakistan phone number
 * Accepts formats: 03XX-XXXXXXX, 03XXXXXXXXX, +92-3XX-XXXXXXX, +923XXXXXXXXX
 * Output format: 03XX-XXXXXXX
 */
export function formatPakistanPhone(value) {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith('+92')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('92') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading 0 if present and add it back
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Limit to 10 digits (03XX-XXXXXXX)
  cleaned = cleaned.substring(0, 10);
  
  // Format: 03XX-XXXXXXX
  if (cleaned.length <= 4) {
    return cleaned.length > 0 ? `0${cleaned}` : '';
  } else {
    return `0${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
}

/**
 * Format ID number as xxxxx-xxxxxxx-x
 * Only allows digits and formats automatically
 */
export function formatIdNumber(value) {
  // Remove all non-digit characters
  let cleaned = value.replace(/\D/g, '');
  
  // Limit to 13 digits (xxxxx-xxxxxxx-x)
  cleaned = cleaned.substring(0, 13);
  
  // Format: xxxxx-xxxxxxx-x
  if (cleaned.length <= 5) {
    return cleaned;
  } else if (cleaned.length <= 12) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  } else {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 12)}-${cleaned.substring(12)}`;
  }
}

/**
 * Format currency as Rs. (Pakistani Rupees)
 * Rounds to whole numbers (no decimals)
 */
export function formatCurrency(amount) {
  const rounded = Math.round(parseFloat(amount) || 0);
  return `Rs. ${rounded.toLocaleString('en-PK')}`;
}

/**
 * Format currency without symbol (just the number)
 * Rounds to whole numbers
 */
export function formatCurrencyNumber(amount) {
  return Math.round(parseFloat(amount) || 0).toLocaleString('en-PK');
}