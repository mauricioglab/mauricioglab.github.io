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
}

export const projects: Project[] = [
  {
    id: 'ecommerce',
    featured: true,
    profiles: {
      engineer: {
        tags: ['.NET Core 8', 'Angular 17', 'SQL Server', 'Redis', 'Docker', 'DDD', 'Event Storming'],
        icon: 'fa-shopping-cart'
      }
    },
    links: {
      demo: 'https://demo-ecommerce.example.com',
      github: 'https://github.com/tu-usuario/ecommerce-platform',
      caseStudy: '/proyectos/ecommerce-platform'
    },
    image: '/projects/ecommerce.jpg'
  },
  {
    id: 'task-manager-ddd',
    featured: true,
    profiles: {
      engineer: {
        tags: ['.NET 8', 'Angular', 'CQRS', 'Event Sourcing', 'Azure', 'DDD', 'Clean Architecture'],
        icon: 'fa-tasks'
      }
    },
    links: {
      github: 'https://github.com/tu-usuario/task-manager-ddd',
      caseStudy: '/proyectos/task-manager-ddd'
    },
    image: '/projects/task-manager.jpg'
  },
  {
    id: 'microservicios-api',
    featured: true,
    profiles: {
      engineer: {
        tags: ['.NET Core', 'RabbitMQ', 'gRPC', 'Docker', 'Kubernetes', 'Event-Driven', 'Saga Pattern'],
        icon: 'fa-network-wired'
      }
    },
    links: {
      github: 'https://github.com/tu-usuario/microservices-api',
      caseStudy: '/proyectos/microservicios-api'
    },
    image: '/projects/microservices.jpg'
  },
  {
    id: 'mundial-2026',
    featured: true,
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
