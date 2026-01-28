import type { ProfileId } from './profiles';

export type SkillLevel = 'expert' | 'advanced' | 'intermediate';

export interface Skill {
  name: string;  // Technical name (not translated)
  icon: string;
  level: SkillLevel;
}

export interface SkillCategory {
  categoryKey: string;  // Key for i18n lookup (e.g., 'backend', 'frontend')
  skills: Skill[];
}

export type SkillsByProfile = Record<ProfileId, SkillCategory[]>;

export const skillsByProfile: SkillsByProfile = {
  developer: [
    {
      categoryKey: 'backend',
      skills: [
        { name: '.NET Core 8', icon: 'fa-code', level: 'expert' },
        { name: 'C#', icon: 'fa-code', level: 'expert' },
        { name: 'Entity Framework', icon: 'fa-database', level: 'expert' },
        { name: 'SQL Server', icon: 'fa-database', level: 'expert' },
        { name: 'Redis', icon: 'fa-server', level: 'advanced' },
        { name: 'RabbitMQ', icon: 'fa-exchange-alt', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'frontend',
      skills: [
        { name: 'Angular 17', icon: 'fab fa-angular', level: 'expert' },
        { name: 'TypeScript', icon: 'fa-code', level: 'expert' },
        { name: 'RxJS', icon: 'fa-stream', level: 'advanced' },
        { name: 'Tailwind CSS', icon: 'fa-paint-brush', level: 'advanced' },
        { name: 'NgRx', icon: 'fa-layer-group', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'devops',
      skills: [
        { name: 'Docker', icon: 'fab fa-docker', level: 'advanced' },
        { name: 'Azure', icon: 'fab fa-microsoft', level: 'advanced' },
        { name: 'GitHub Actions', icon: 'fab fa-github', level: 'advanced' },
        { name: 'Kubernetes', icon: 'fa-dharmachakra', level: 'intermediate' }
      ]
    },
    {
      categoryKey: 'testing',
      skills: [
        { name: 'xUnit', icon: 'fa-vial', level: 'expert' },
        { name: 'Cypress', icon: 'fa-robot', level: 'advanced' },
        { name: 'Postman', icon: 'fa-paper-plane', level: 'advanced' }
      ]
    }
  ],
  analista: [
    {
      categoryKey: 'modeling',
      skills: [
        { name: 'UML', icon: 'fa-project-diagram', level: 'expert' },
        { name: 'BPMN', icon: 'fa-sitemap', level: 'expert' },
        { name: 'C4 Model', icon: 'fa-layer-group', level: 'advanced' },
        { name: 'Event Storming', icon: 'fa-sticky-note', level: 'advanced' },
        { name: 'User Stories', icon: 'fa-users', level: 'expert' }
      ]
    },
    {
      categoryKey: 'architecture',
      skills: [
        { name: 'Domain-Driven Design', icon: 'fa-cube', level: 'expert' },
        { name: 'Clean Architecture', icon: 'fa-layer-group', level: 'expert' },
        { name: 'Microservices', icon: 'fa-cubes', level: 'advanced' },
        { name: 'CQRS', icon: 'fa-exchange-alt', level: 'advanced' },
        { name: 'Event Sourcing', icon: 'fa-stream', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'tools',
      skills: [
        { name: 'Enterprise Architect', icon: 'fa-drafting-compass', level: 'advanced' },
        { name: 'Lucidchart', icon: 'fa-chart-line', level: 'advanced' },
        { name: 'Miro', icon: 'fa-chalkboard', level: 'advanced' },
        { name: 'Swagger/OpenAPI', icon: 'fa-file-code', level: 'expert' }
      ]
    },
    {
      categoryKey: 'technical',
      skills: [
        { name: '.NET', icon: 'fa-code', level: 'expert' },
        { name: 'SQL', icon: 'fa-database', level: 'expert' },
        { name: 'Angular', icon: 'fab fa-angular', level: 'advanced' }
      ]
    }
  ],
  'ia-engineer': [
    {
      categoryKey: 'ai',
      skills: [
        { name: 'LangChain', icon: 'fa-link', level: 'expert' },
        { name: 'OpenAI API', icon: 'fa-brain', level: 'expert' },
        { name: 'RAG Architecture', icon: 'fa-search', level: 'expert' },
        { name: 'Prompt Engineering', icon: 'fa-comment-dots', level: 'expert' },
        { name: 'Function Calling', icon: 'fa-code', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'python',
      skills: [
        { name: 'Python 3.11+', icon: 'fab fa-python', level: 'expert' },
        { name: 'FastAPI', icon: 'fa-bolt', level: 'expert' },
        { name: 'Pydantic', icon: 'fa-check-circle', level: 'expert' },
        { name: 'Pandas', icon: 'fa-table', level: 'advanced' },
        { name: 'NumPy', icon: 'fa-calculator', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'vectordb',
      skills: [
        { name: 'Pinecone', icon: 'fa-database', level: 'expert' },
        { name: 'Chroma', icon: 'fa-database', level: 'advanced' },
        { name: 'Embeddings', icon: 'fa-vector-square', level: 'expert' }
      ]
    },
    {
      categoryKey: 'integration',
      skills: [
        { name: '.NET Integration', icon: 'fa-plug', level: 'advanced' },
        { name: 'REST APIs', icon: 'fa-exchange-alt', level: 'expert' },
        { name: 'WebSockets', icon: 'fa-broadcast-tower', level: 'advanced' }
      ]
    }
  ],
  freelance: [
    {
      categoryKey: 'frontend',
      skills: [
        { name: 'Angular', icon: 'fab fa-angular', level: 'expert' },
        { name: 'React', icon: 'fab fa-react', level: 'advanced' },
        { name: 'TypeScript', icon: 'fa-code', level: 'expert' },
        { name: 'JavaScript', icon: 'fab fa-js', level: 'expert' }
      ]
    },
    {
      categoryKey: 'backend',
      skills: [
        { name: '.NET Core', icon: 'fa-server', level: 'expert' },
        { name: 'Node.js', icon: 'fab fa-node', level: 'expert' },
        { name: 'Python', icon: 'fab fa-python', level: 'advanced' },
        { name: 'Docker', icon: 'fab fa-docker', level: 'expert' }
      ]
    },
    {
      categoryKey: 'cloud',
      skills: [
        { name: 'AWS', icon: 'fab fa-aws', level: 'advanced' },
        { name: 'Azure', icon: 'fab fa-microsoft', level: 'advanced' },
        { name: 'SQL Server', icon: 'fa-database', level: 'expert' },
        { name: 'Git', icon: 'fab fa-git-alt', level: 'expert' }
      ]
    },
    {
      categoryKey: 'leadership',
      skills: [
        { name: 'Scrum/Agile', icon: 'fa-tasks', level: 'expert' },
        { name: 'Code Review', icon: 'fa-search', level: 'expert' },
        { name: 'Mentorship', icon: 'fa-user-graduate', level: 'expert' },
        { name: 'Architecture', icon: 'fa-sitemap', level: 'expert' }
      ]
    }
  ],
  speaker: [
    {
      categoryKey: 'ai',
      skills: [
        { name: 'Prompt Engineering', icon: 'fa-comment-dots', level: 'expert' },
        { name: 'ChatGPT/LLMs', icon: 'fa-robot', level: 'expert' },
        { name: 'n8n Automation', icon: 'fa-cogs', level: 'expert' },
        { name: 'Generative AI', icon: 'fa-brain', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'programming',
      skills: [
        { name: 'Angular', icon: 'fab fa-angular', level: 'expert' },
        { name: 'C# / .NET', icon: 'fa-code', level: 'expert' },
        { name: 'Python', icon: 'fab fa-python', level: 'advanced' },
        { name: 'Databases', icon: 'fa-database', level: 'expert' }
      ]
    },
    {
      categoryKey: 'soft',
      skills: [
        { name: 'Public Speaking', icon: 'fa-microphone', level: 'expert' },
        { name: 'Didactics', icon: 'fa-chalkboard-teacher', level: 'expert' },
        { name: 'Facilitation', icon: 'fa-users', level: 'expert' },
        { name: 'Storytelling', icon: 'fa-book-open', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'formats',
      skills: [
        { name: 'Talks', icon: 'fa-presentation', level: 'expert' },
        { name: 'Workshops', icon: 'fa-laptop-code', level: 'expert' },
        { name: 'Training', icon: 'fa-graduation-cap', level: 'expert' },
        { name: 'Mentoring', icon: 'fa-handshake', level: 'advanced' }
      ]
    }
  ],
  docente: [
    {
      categoryKey: 'programming',
      skills: [
        { name: 'Python', icon: 'fab fa-python', level: 'expert' },
        { name: 'C# / .NET', icon: 'fa-code', level: 'expert' },
        { name: 'JavaScript', icon: 'fab fa-js', level: 'expert' },
        { name: 'SQL', icon: 'fa-database', level: 'expert' }
      ]
    },
    {
      categoryKey: 'ai',
      skills: [
        { name: 'ChatGPT/LLMs', icon: 'fa-robot', level: 'expert' },
        { name: 'Prompt Engineering', icon: 'fa-comment-dots', level: 'expert' },
        { name: 'AI Tools', icon: 'fa-brain', level: 'advanced' },
        { name: 'Automation', icon: 'fa-cogs', level: 'advanced' }
      ]
    },
    {
      categoryKey: 'pedagogy',
      skills: [
        { name: 'Didactics', icon: 'fa-chalkboard-teacher', level: 'expert' },
        { name: 'Curriculum Design', icon: 'fa-book', level: 'expert' },
        { name: 'Assessment', icon: 'fa-tasks', level: 'expert' },
        { name: 'Mentoring', icon: 'fa-user-graduate', level: 'expert' }
      ]
    },
    {
      categoryKey: 'tools',
      skills: [
        { name: 'VS Code', icon: 'fa-code', level: 'expert' },
        { name: 'Git/GitHub', icon: 'fab fa-github', level: 'expert' },
        { name: 'Moodle/LMS', icon: 'fa-graduation-cap', level: 'advanced' },
        { name: 'Classroom Tools', icon: 'fa-desktop', level: 'advanced' }
      ]
    }
  ]
};
