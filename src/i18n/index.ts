// i18n Helper Functions for Astro
// Provides utilities for language detection and translation loading

export type Lang = 'es' | 'en';
export const defaultLang: Lang = 'es';
export const supportedLangs: Lang[] = ['es', 'en'];

/**
 * Extract language from URL pathname
 * @example /es/landing/developer -> 'es'
 * @example /en/landing/developer -> 'en'
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
 * @param namespace - The translation file to load (e.g., 'common', 'developer')
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
  nav: {
    projects: string;
    skills: string;
    experience: string;
    blog: string;
    contact: string;
  };
  hero: {
    yearsExp: string;
    yearsExpSub: string;
    location: string;
    locationSub: string;
    availability: string;
    availabilitySub: string;
  };
  sections: {
    featuredProjects: string;
    techStack: string;
    experience: string;
    methodology: string;
    background: string;
  };
  cta: {
    contact: string;
    downloadCV: string;
    sendEmail: string;
    scheduleCall: string;
    connectLinkedIn: string;
    viewRepos: string;
  };
  footer: {
    links: string;
    contact: string;
    rights: string;
  };
  theme: {
    light: string;
    dark: string;
  };
}

export interface ProfileTranslations {
  title: string;
  subtitle: string;
  description: string;
  seo: {
    title: string;
    description: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  projectsDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  methodology?: {
    title1: string;
    desc1: string;
    title2: string;
    desc2: string;
    title3: string;
    desc3: string;
  };
  background?: {
    title1: string;
    desc1: string;
    title2: string;
    desc2: string;
  };
  services?: {
    title1: string;
    desc1: string;
    title2: string;
    desc2: string;
    title3: string;
    desc3: string;
  };
  topics?: {
    title1: string;
    desc1: string;
    title2: string;
    desc2: string;
    title3: string;
    desc3: string;
  };
  subjects?: {
    title1: string;
    desc1: string;
    title2: string;
    desc2: string;
    title3: string;
    desc3: string;
    title4?: string;
    desc4?: string;
  };
  experience: {
    role1: string;
    company1: string;
    items1: string[];
    role2: string;
    company2: string;
    items2: string[];
  };
}

export interface SkillsTranslations {
  categories: Record<string, Record<string, string>>;
  levels: {
    expert: string;
    advanced: string;
    intermediate: string;
  };
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
