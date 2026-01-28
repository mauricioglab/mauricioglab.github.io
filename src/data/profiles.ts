import { SITE_CONFIG } from './config';

export type ProfileId = 'developer' | 'analista' | 'ia-engineer' | 'freelance' | 'speaker' | 'docente';

export interface Profile {
  id: ProfileId;
  cvUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    cardBg: string;
  };
}

export const profiles: Record<ProfileId, Profile> = {
  developer: {
    id: 'developer',
    cvUrl: SITE_CONFIG.cvs.developer,
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'blue-600',
      secondary: 'blue-100',
      accent: 'blue-500',
      bg: 'white',
      text: 'slate-900',
      cardBg: 'white'
    }
  },
  analista: {
    id: 'analista',
    cvUrl: SITE_CONFIG.cvs.analista,
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'slate-900',
      secondary: 'slate-100',
      accent: 'slate-700',
      bg: 'slate-50',
      text: 'slate-900',
      cardBg: 'white'
    }
  },
  'ia-engineer': {
    id: 'ia-engineer',
    cvUrl: SITE_CONFIG.cvs['ia-engineer'],
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'emerald-600',
      secondary: 'emerald-500/10',
      accent: 'emerald-400',
      bg: 'slate-950',
      text: 'slate-100',
      cardBg: 'slate-900'
    }
  },
  freelance: {
    id: 'freelance',
    cvUrl: SITE_CONFIG.cvs.freelance,
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'orange-600',
      secondary: 'orange-100',
      accent: 'orange-500',
      bg: 'white',
      text: 'slate-900',
      cardBg: 'white'
    }
  },
  speaker: {
    id: 'speaker',
    cvUrl: SITE_CONFIG.cvs.speaker,
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'purple-600',
      secondary: 'purple-100',
      accent: 'purple-500',
      bg: 'white',
      text: 'slate-900',
      cardBg: 'white'
    }
  },
  docente: {
    id: 'docente',
    cvUrl: SITE_CONFIG.cvs.docente,
    githubUrl: SITE_CONFIG.github,
    linkedinUrl: SITE_CONFIG.linkedin,
    email: SITE_CONFIG.email,
    theme: {
      primary: 'teal-600',
      secondary: 'teal-100',
      accent: 'teal-500',
      bg: 'white',
      text: 'slate-900',
      cardBg: 'white'
    }
  }
};
