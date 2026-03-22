import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Digits for https://wa.me/{digits} (no +). Pakistan mobile patterns plus 10–15 digit numbers with country code.
 */
export function digitsForWhatsApp(phoneNumber) {
  if (!phoneNumber || String(phoneNumber).includes("@")) return null;
  const cleaned = String(phoneNumber).replace(/\D/g, "");

  if (cleaned.length === 12 && cleaned.startsWith("92")) return cleaned;
  if (cleaned.length === 11 && cleaned.startsWith("0")) return `92${cleaned.slice(1)}`;
  if (cleaned.length === 10 && /^3\d{9}$/.test(cleaned)) return `92${cleaned}`;

  if (cleaned.length >= 10 && cleaned.length <= 15) return cleaned;

  return null;
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