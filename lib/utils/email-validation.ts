// lib/utils/email-validation.ts

/**
 * List of common free email providers to block for organization signups
 */
const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com', // Alternative Gmail domain
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'inbox.com',
  'mail.ru',
  'qq.com',
  '163.com',
  'yeah.net',
  'tutanota.com',
  'fastmail.com',
  'hushmail.com',
  'runbox.com',
  'mailinator.com',
  'guerrillamail.com',
  'temp-mail.org',
  '10minutemail.com',
];

/**
 * Validates if an email is a business/organization email
 * @param email - The email address to validate
 * @returns Object with isValid boolean and optional error message
 */
export function isOrganizationEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Extract domain from email
  const domain = email.toLowerCase().split('@')[1];

  if (!domain) {
    return { isValid: false, error: 'Invalid email domain' };
  }

  // Check if it's a free email provider
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: 'Please use your organization email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed.',
    };
  }

  // Additional check: Reject emails from gmail.com or googlemail.com subdomains
  if (domain.includes('gmail.') || domain.includes('googlemail.')) {
    return {
      isValid: false,
      error: 'Personal Gmail accounts are not allowed. Please use your organization email address.',
    };
  }

  return { isValid: true };
}

/**
 * Extract company name from email domain
 * @param email - The email address
 * @returns Formatted company name or null
 */
export function extractCompanyFromEmail(email: string): string | null {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return null;

  // Remove common TLDs and format
  const companyName = domain
    .split('.')[0] // Get first part before TLD
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return companyName;
}
