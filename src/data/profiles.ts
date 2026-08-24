import { SITE_CONFIG } from './config';

export type ProfileId = 'engineer';

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
  engineer: {
    id: 'engineer',
    cvUrl: SITE_CONFIG.cv,
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
  }
};
