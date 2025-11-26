/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return plain text
    return html.replace(/<[^>]*>/g, '');
  }

  // Client-side: use DOMPurify if available, otherwise strip tags
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitizes plain text input
 * Removes control characters and trims whitespace
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (Indian format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates text length
 */
export function validateLength(text: string, min: number, max: number): boolean {
  const length = text.trim().length;
  return length >= min && length <= max;
}

/**
 * Validates that text contains only allowed characters
 */
export function validateAllowedChars(text: string, allowedPattern: RegExp): boolean {
  return allowedPattern.test(text);
}

/**
 * Rate limiting helper (client-side only, server-side should use proper rate limiting)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed
   * @param key Unique identifier for the rate limit (e.g., user ID, IP address)
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests outside the time window
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: {
    validate: isValidEmail,
    message: 'Please enter a valid email address',
  },
  phone: {
    validate: isValidPhoneNumber,
    message: 'Please enter a valid 10-digit phone number',
  },
  url: {
    validate: isValidUrl,
    message: 'Please enter a valid URL',
  },
  required: {
    validate: (value: string) => value.trim().length > 0,
    message: 'This field is required',
  },
  minLength: (min: number) => ({
    validate: (value: string) => value.trim().length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (max: number) => ({
    validate: (value: string) => value.trim().length <= max,
    message: `Must be no more than ${max} characters`,
  }),
};

