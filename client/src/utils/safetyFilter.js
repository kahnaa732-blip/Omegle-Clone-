/**
 * Haven Safety & Abuse Prevention Engine
 * Client-side heuristic filter for detecting malicious links, personal information harvesting,
 * and high-risk patterns before transmission.
 */

// Known IP-logger, phishing and high-risk URL domains
const SUSPICIOUS_DOMAINS = [
  'grabify.link',
  'iplogger.org',
  '2no.co',
  'yip.su',
  'iplis.ru',
  'ezstat.ru',
  'curiouscat.live',
  'psportable.net'
];

// Regex to detect raw IPv4 links like http://123.45.67.89/
const RAW_IP_URL_REGEX = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;

// Regex to detect phone numbers (international or standard 10-digit formats)
const PHONE_NUMBER_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/;

// Regex to detect credit card sequences (Luhn-like 16-digit blocks)
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;

// Regex to detect general URLs
const GENERAL_URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|xyz|io|me|ru|tk|top|click)\b[^\s]*)/gi;

export function inspectMessageForSafety(text) {
  if (!text || typeof text !== 'string') {
    return { isAllowed: true, warnings: [] };
  }

  const warnings = [];

  // 1. Check for raw IP addresses or known IP logger links
  if (RAW_IP_URL_REGEX.test(text)) {
    return {
      isAllowed: false,
      blockedReason: 'Direct IP address links are prohibited for safety and anti-tracking.'
    };
  }

  const lower = text.toLowerCase();
  for (const domain of SUSPICIOUS_DOMAINS) {
    if (lower.includes(domain)) {
      return {
        isAllowed: false,
        blockedReason: 'Deceptive or IP-grabbing link detected and blocked.'
      };
    }
  }

  // 2. Check for credit card or financial indicators
  if (CREDIT_CARD_REGEX.test(text)) {
    return {
      isAllowed: false,
      blockedReason: 'Financial or payment card numbers cannot be shared in chat.'
    };
  }

  // 3. Warn on phone numbers
  if (PHONE_NUMBER_REGEX.test(text)) {
    warnings.push('Privacy Alert: Never share personal phone numbers with strangers.');
  }

  // 4. General link caution
  if (GENERAL_URL_REGEX.test(text)) {
    warnings.push('Link Notice: Be cautious clicking links sent by strangers.');
  }

  return {
    isAllowed: true,
    warnings
  };
}
