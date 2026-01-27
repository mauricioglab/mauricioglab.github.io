import type { ProfileId } from './profiles';

export interface ProjectProfile {
  tags: string[];
  icon: string;
}

export interface Project {
  id: string;
  profiles: {
    developer?: ProjectProfile;
    analista?: ProjectProfile;
    'ia-engineer'?: ProjectProfile;
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
      developer: {
        tags: ['.NET Core 8', 'Angular 17', 'SQL Server', 'Redis', 'Docker'],
        icon: 'fa-shopping-cart'
      },
      analista: {
        tags: ['DDD', 'UML', 'Event Storming', 'Microservices', 'BPMN'],
        icon: 'fa-project-diagram'
      },
      'ia-engineer': {
        tags: ['Python', 'LangChain', 'Pinecone', 'OpenAI', 'FastAPI'],
        icon: 'fa-robot'
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
      developer: {
        tags: ['.NET 8', 'Angular', 'CQRS', 'Event Sourcing', 'Azure'],
        icon: 'fa-tasks'
      },
      analista: {
        tags: ['DDD', 'Clean Architecture', 'UML', 'C4 Model', 'Domain Modeling'],
        icon: 'fa-sitemap'
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
      developer: {
        tags: ['.NET Core', 'RabbitMQ', 'gRPC', 'Docker', 'Kubernetes'],
        icon: 'fa-network-wired'
      },
      analista: {
        tags: ['Microservices', 'Event-Driven', 'Saga Pattern', 'API Design'],
        icon: 'fa-cubes'
      }
    },
    links: {
      github: 'https://github.com/tu-usuario/microservices-api',
      caseStudy: '/proyectos/microservicios-api'
    },
    image: '/projects/microservices.jpg'
  },
  {
    id: 'chatbot-rag',
    featured: true,
    profiles: {
      'ia-engineer': {
        tags: ['Python', 'LangChain', 'OpenAI', 'Pinecone', 'FastAPI', 'RAG'],
        icon: 'fa-comments'
      },
      developer: {
        tags: ['Python', 'FastAPI', 'React', 'WebSockets', 'OAuth2'],
        icon: 'fa-robot'
      }
    },
    links: {
      github: 'https://github.com/tu-usuario/chatbot-rag'
      // caseStudy: No existe página todavía
    },
    image: '/projects/chatbot.jpg'
  },
  {
    id: 'data-extraction-llm',
    featured: false,
    profiles: {
      'ia-engineer': {
        tags: ['Python', 'Pydantic', 'GPT-4', 'PDF Processing', 'Automation'],
        icon: 'fa-file-invoice'
      },
      developer: {
        tags: ['Azure Functions', 'SQL Server', 'Python', '.NET Integration'],
        icon: 'fa-cogs'
      }
    },
    links: {
      github: 'https://github.com/tu-usuario/data-extraction-llm'
    },
    image: '/projects/extraction.jpg'
  }
];

// Helper to filter projects by profile
export function getProjectsByProfile(profileId: 'developer' | 'analista' | 'ia-engineer', featuredOnly = false) {
  return projects.filter(project => {
    const hasProfile = project.profiles[profileId] !== undefined;
    const isFeatured = featuredOnly ? project.featured : true;
    return hasProfile && isFeatured;
  });
}
