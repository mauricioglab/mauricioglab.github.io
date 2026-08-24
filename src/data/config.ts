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
  author: 'Mauricio Gonzalez',
  authorTitle: 'Full Stack Developer',
  
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
  location: 'Argentina',

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
  siteName: 'MG Lab Depot',
  siteUrl: 'https://tu-dominio.com',        // URL de producción
  defaultDescription: 'MG Lab Applications',
  
  // =====================
  // CV (único)
  // =====================
  // Ruta a la página del CV único (ver src/pages/cv.astro). No hay PDF real
  // todavía — cuando exista, apuntar acá al archivo en /public.
  cv: '/cv/',
  
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

/**
 * Get copyright text with current year
 */
export const getCopyright = (year = new Date().getFullYear()) => 
  `© ${year} ${SITE_CONFIG.author} - ${SITE_CONFIG.authorTitle}`;
