// i18n Helper Functions for Astro
// Provides utilities for language detection and translation loading

export type Lang = 'es' | 'en';
export const defaultLang: Lang = 'es';
export const supportedLangs: Lang[] = ['es', 'en'];

/**
 * Extract language from URL pathname
 * @example /es/portfolio -> 'es'
 * @example /en/portfolio -> 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (supportedLangs.includes(lang as Lang)) {
    return lang as Lang;
  }
  return defaultLang;
}

/**
 * Get the alternate language URL for language switcher
 */
export function getAlternateUrl(url: URL, currentLang: Lang): string {
  const altLang = currentLang === 'es' ? 'en' : 'es';
  const pathWithoutLang = url.pathname.replace(/^\/(es|en)/, '');
  return `/${altLang}${pathWithoutLang}`;
}

/**
 * Load translations from a namespace (JSON file)
 * @param lang - The language to load ('es' | 'en')
 * @param namespace - The translation file to load (e.g., 'common', 'engineer')
 */
export async function useTranslations<T = Record<string, unknown>>(
  lang: Lang,
  namespace: string
): Promise<T> {
  try {
    const translations = await import(`./${lang}/${namespace}.json`);
    return translations.default as T;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}/${namespace}:`, error);
    // Fallback to default language
    if (lang !== defaultLang) {
      const fallback = await import(`./${defaultLang}/${namespace}.json`);
      return fallback.default as T;
    }
    throw error;
  }
}

/**
 * Synchronous translation getter for static paths
 * Used in getStaticPaths() where async is not ideal
 */
export function getStaticPaths() {
  return supportedLangs.map(lang => ({ params: { lang } }));
}

// Type definitions for common translations
export interface CommonTranslations {
  sections: {
    techStack: string;
  };
}

export interface SkillsTranslations {
  categories: Record<string, Record<string, string>>;
}

export interface ProjectTranslations {
  [projectId: string]: {
    title: string;
    shortDescription: string;
    profiles: {
      [profileId: string]: {
        description: string;
        highlights: string[];
      };
    };
  };
}
