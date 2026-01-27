/**
 * Shared i18n utilities for Astro static paths generation
 */

import { SITE_CONFIG, type SupportedLang } from '../data/config';

/**
 * Get static paths for language-based routing
 * Use this in getStaticPaths() to avoid duplicating the language paths logic
 * 
 * @example
 * export function getStaticPaths() {
 *   return getLanguagePaths();
 * }
 */
export const getLanguagePaths = () => 
  SITE_CONFIG.supportedLangs.map(lang => ({ 
    params: { lang } 
  }));

/**
 * Type for language params from Astro
 */
export interface LangParams {
  lang: SupportedLang;
}

/**
 * Get the alternate language
 */
export const getAlternateLang = (currentLang: SupportedLang): SupportedLang => 
  currentLang === 'es' ? 'en' : 'es';

/**
 * Build a localized URL
 */
export const buildLocalizedUrl = (lang: SupportedLang, path: string): string => 
  `/${lang}${path.startsWith('/') ? path : `/${path}`}`;
