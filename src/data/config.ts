/**
 * Global configuration constants
 * Centralized place for shared URLs, emails, and other configuration
 * 
 * ⚠️ IMPORTANTE: Actualiza estos valores con tu información real
 */

export const SITE_CONFIG = {
  // =====================
  // INFORMACIÓN PERSONAL
  // =====================
  author: 'Mauricio González',

  // =====================
  // CONTACTO
  // =====================
  email: 'mauriciogcode@gmail.com',
  // Email dividido para ofuscación (usado en ContactModal)
  // Unido forma: emailParts[0] + emailDomain[0] = email completo
  emailParts: ['mauriciogcode'],           // parte antes del @
  emailDomain: ['gmail', 'com'],            // dominio dividido
  
  // Formspree endpoint para el formulario de contacto
  formspreeEndpoint: 'https://formspree.io/f/xlgbvgek',
  
  phone: '',                                // Opcional: '+54 9 11 1234-5678'
  location: 'Córdoba, Argentina',

  // WhatsApp dividido en chunks (ofuscación, como emailParts)
  // Unido forma: whatsappChunks.join('') = número en formato internacional
  // Formato internacional argentino requiere el 9: 54 9 351 5137091
  whatsappChunks: ['54', '9', '351', '513', '7091'],
  whatsappMessage: 'Hola Mauricio, ¿cómo estás?',
  
  // =====================
  // REDES SOCIALES Y ENLACES
  // =====================
  github: 'https://github.com/mauricioglab',
  linkedin: 'https://linkedin.com/in/mauricioglab',
  calendly: 'https://calendly.com/mauricioglab',  // Agendar reunión
  twitter: '',                              // Opcional: 'https://twitter.com/tu-usuario'
  youtube: '',                              // Opcional
  
  // =====================
  // SITIO WEB
  // =====================
  siteName: 'Mauricio González',
  siteUrl: 'https://mauricioglab.github.io/',  // URL de producción
  defaultDescription: 'Software Engineer especializado en IA y Automatización',
  
  // =====================
  // CV (único)
  // =====================
  // Ruta a la página del CV único (localizada, default es). Ver src/pages/[lang]/cv.astro.
  cv: '/es/cv/',
  
  // =====================
  // IDIOMAS
  // =====================
  defaultLang: 'es' as const,
  supportedLangs: ['es', 'en'] as const,
} as const;

export type SupportedLang = typeof SITE_CONFIG.supportedLangs[number];

/**
 * Get mailto link for the contact email
 */
export const getMailtoLink = () => `mailto:${SITE_CONFIG.email}`;
