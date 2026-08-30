import type { ProfileId } from './profiles';

export interface ProjectProfile {
  tags: string[];
  icon: string;
}

export interface Project {
  id: string;
  profiles: {
    engineer?: ProjectProfile;
  };
  links: {
    demo?: string;
    github?: string;
    caseStudy?: string;
  };
  image?: string;
  featured: boolean;
  category?: 'ia' | 'desarrollo' | 'analisis';
}

export const projects: Project[] = [
  {
    id: 'validacion-biometrica',
    featured: true,
    category: 'ia',
    profiles: {
      engineer: {
        tags: ['AWS Rekognition', 'RENAPER', 'Node.js/NestJS', 'Angular', 'AWS QLDB', 'Reconocimiento facial'],
        icon: 'fa-fingerprint'
      }
    },
    links: {
      caseStudy: '/proyectos/validacion-biometrica'
    }
  },
  {
    id: 'billetera-virtual',
    featured: true,
    category: 'desarrollo',
    profiles: {
      engineer: {
        tags: ['.NET Framework 4.5', 'DDD', 'CQRS', 'Mediator', 'Docker', 'Amazon ECS', 'Microservicios'],
        icon: 'fa-wallet'
      }
    },
    links: {
      caseStudy: '/proyectos/billetera-virtual'
    }
  },
  {
    id: 'monitoreo-agricola',
    featured: true,
    category: 'ia',
    profiles: {
      engineer: {
        tags: ['Python', 'Scikit-learn', 'Google Colab', 'AWS Lambda', 'AWS QLDB', 'Node.js', 'Angular'],
        icon: 'fa-leaf'
      }
    },
    links: {
      caseStudy: '/proyectos/monitoreo-agricola'
    }
  },
  {
    id: 'auditorias-datos',
    featured: true,
    category: 'desarrollo',
    profiles: {
      engineer: {
        tags: ['Angular 17-18', '.NET Core', 'C#', 'SQL Server', 'Entity Framework', 'Reportes PDF/Excel'],
        icon: 'fa-clipboard-check'
      }
    },
    links: {
      caseStudy: '/proyectos/auditorias-datos'
    }
  },
  {
    id: 'coca-cola-embonor',
    featured: true,
    category: 'desarrollo',
    profiles: {
      engineer: {
        tags: ['ASP.NET', 'C#', 'SQL Server', 'Entity Framework', 'SAP API'],
        icon: 'fa-building'
      }
    },
    links: {
      caseStudy: '/proyectos/coca-cola-embonor'
    }
  },
  {
    id: 'mundial-2026',
    featured: true,
    category: 'ia',
    profiles: {
      engineer: {
        tags: ['Python', 'Pandas', 'Statsmodels', 'Plotly', 'Streamlit', 'Monte Carlo'],
        icon: 'fa-futbol'
      }
    },
    links: {
      demo: 'https://casosstudio-fkeqyq3uwpxvhtxvkthhsc.streamlit.app/',
      github: 'https://github.com/mauricioglab/casos_studio',
      caseStudy: '/proyectos/mundial-2026'
    }
  },
  {
    id: 'caso-arquitectura',
    featured: true,
    category: 'analisis',
    profiles: {
      engineer: {
        tags: ['UML', 'DER', 'DFD', 'Event Storming', 'Feasibility Study', 'Scrum'],
        icon: 'fa-drafting-compass'
      }
    },
    links: {
      demo: '/caso-arquitectura',
      github: 'https://github.com/mauricioglab/caso-estudio-arquitectura'
    }
  },
  {
    id: 'abandono-estudiantil',
    featured: true,
    category: 'ia',
    profiles: {
      engineer: {
        tags: ['Python', 'Pandas', 'Scikit-learn', 'Plotly', 'Streamlit', 'Clasificación'],
        icon: 'fa-graduation-cap'
      }
    },
    links: {
      demo: 'https://casosstudio-hktsnxogexobqypet55po6.streamlit.app/',
      github: 'https://github.com/mauricioglab/casos_studio',
      caseStudy: '/proyectos/abandono-estudiantil'
    }
  }
];

// Helper to filter projects by profile
export function getProjectsByProfile(profileId: ProfileId, featuredOnly = false) {
  return projects.filter(project => {
    const hasProfile = project.profiles[profileId] !== undefined;
    const isFeatured = featuredOnly ? project.featured : true;
    return hasProfile && isFeatured;
  });
}
