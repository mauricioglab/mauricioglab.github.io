/**
 * Global configuration constants
 * Centralized place for shared URLs, emails, and other configuration
 */

export const SITE_CONFIG = {
  // Contact information
  email: 'mauriciogcode@gmail.com',
  
  // Social URLs
  github: 'https://github.com/tu-usuario',
  linkedin: 'https://linkedin.com/in/mauricioglab',
  
  // Site metadata
  siteName: 'MG Lab Depot',
  defaultDescription: 'MG Lab Applications',
  
  // Copyright
  author: 'Mauricio Gonzalez',
  authorTitle: 'Full Stack Developer',
  
  // Supported languages
  defaultLang: 'es' as const,
  supportedLangs: ['es', 'en'] as const,
} as const;

export type SupportedLang = typeof SITE_CONFIG.supportedLangs[number];

/**
 * Get mailto link for the contact email
 */
export const getMailtoLink = () => `mailto:${SITE_CONFIG.email}`;

/**
 * Get copyright text with current year
 */
export const getCopyright = (year = new Date().getFullYear()) => 
  `© ${year} ${SITE_CONFIG.author} - ${SITE_CONFIG.authorTitle}`;
