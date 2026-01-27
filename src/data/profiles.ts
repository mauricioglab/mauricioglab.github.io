export type ProfileId = 'developer' | 'analista' | 'ia-engineer' | 'freelance' | 'speaker';

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
    cvUrl: '/cv-developer.pdf',
    githubUrl: 'https://github.com/tu-usuario',
    linkedinUrl: 'https://linkedin.com/in/tu-perfil',
    email: 'tu-email@example.com',
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
    cvUrl: '/cv-analista.pdf',
    githubUrl: 'https://github.com/tu-usuario',
    linkedinUrl: 'https://linkedin.com/in/tu-perfil',
    email: 'tu-email@example.com',
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
    cvUrl: '/cv-ia.pdf',
    githubUrl: 'https://github.com/tu-usuario',
    linkedinUrl: 'https://linkedin.com/in/tu-perfil',
    email: 'tu-email@example.com',
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
    cvUrl: '/cv-freelance.pdf',
    githubUrl: 'https://github.com/tu-usuario',
    linkedinUrl: 'https://linkedin.com/in/mauricioglab',
    email: 'tu-email@example.com',
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
    cvUrl: '/cv-speaker.pdf',
    githubUrl: 'https://github.com/tu-usuario',
    linkedinUrl: 'https://linkedin.com/in/mauricioglab',
    email: 'tu-email@example.com',
    theme: {
      primary: 'purple-600',
      secondary: 'purple-100',
      accent: 'purple-500',
      bg: 'white',
      text: 'slate-900',
      cardBg: 'white'
    }
  }
};
