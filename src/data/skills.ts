import type { ProfileId } from './profiles';

export interface Skill {
  name: string;  // Technical name (not translated)
  icon: string;
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
        { name: '.NET Core 8', icon: 'fa-code' },
        { name: 'C#', icon: 'fa-code' },
        { name: 'Entity Framework', icon: 'fa-database' },
        { name: 'SQL Server', icon: 'fa-database' },
        { name: 'Redis', icon: 'fa-server' },
        { name: 'RabbitMQ', icon: 'fa-exchange-alt' }
      ]
    },
    {
      categoryKey: 'frontend',
      skills: [
        { name: 'Angular 17', icon: 'fab fa-angular' },
        { name: 'TypeScript', icon: 'fa-code' },
        { name: 'RxJS', icon: 'fa-stream' },
        { name: 'Tailwind CSS', icon: 'fa-paint-brush' },
        { name: 'NgRx', icon: 'fa-layer-group' }
      ]
    },
    {
      categoryKey: 'devops',
      skills: [
        { name: 'Docker', icon: 'fab fa-docker' },
        { name: 'Azure', icon: 'fab fa-microsoft' },
        { name: 'GitHub Actions', icon: 'fab fa-github' },
        { name: 'Kubernetes', icon: 'fa-dharmachakra' }
      ]
    },
    {
      categoryKey: 'testing',
      skills: [
        { name: 'xUnit', icon: 'fa-vial' },
        { name: 'Cypress', icon: 'fa-robot' },
        { name: 'Postman', icon: 'fa-paper-plane' }
      ]
    }
  ],
  analista: [
    {
      categoryKey: 'modeling',
      skills: [
        { name: 'UML', icon: 'fa-project-diagram' },
        { name: 'BPMN', icon: 'fa-sitemap' },
        { name: 'C4 Model', icon: 'fa-layer-group' },
        { name: 'Event Storming', icon: 'fa-sticky-note' },
        { name: 'User Stories', icon: 'fa-users' }
      ]
    },
    {
      categoryKey: 'architecture',
      skills: [
        { name: 'Domain-Driven Design', icon: 'fa-cube' },
        { name: 'Clean Architecture', icon: 'fa-layer-group' },
        { name: 'Microservices', icon: 'fa-cubes' },
        { name: 'CQRS', icon: 'fa-exchange-alt' },
        { name: 'Event Sourcing', icon: 'fa-stream' }
      ]
    },
    {
      categoryKey: 'tools',
      skills: [
        { name: 'Enterprise Architect', icon: 'fa-drafting-compass' },
        { name: 'Lucidchart', icon: 'fa-chart-line' },
        { name: 'Miro', icon: 'fa-chalkboard' },
        { name: 'Swagger/OpenAPI', icon: 'fa-file-code' }
      ]
    },
    {
      categoryKey: 'technical',
      skills: [
        { name: '.NET', icon: 'fa-code' },
        { name: 'SQL', icon: 'fa-database' },
        { name: 'Angular', icon: 'fab fa-angular' }
      ]
    }
  ],
  'ia-engineer': [
    {
      categoryKey: 'ai',
      skills: [
        { name: 'LangChain', icon: 'fa-link' },
        { name: 'OpenAI API', icon: 'fa-brain' },
        { name: 'RAG Architecture', icon: 'fa-search' },
        { name: 'Prompt Engineering', icon: 'fa-comment-dots' },
        { name: 'Function Calling', icon: 'fa-code' }
      ]
    },
    {
      categoryKey: 'python',
      skills: [
        { name: 'Python 3.11+', icon: 'fab fa-python' },
        { name: 'FastAPI', icon: 'fa-bolt' },
        { name: 'Pydantic', icon: 'fa-check-circle' },
        { name: 'Pandas', icon: 'fa-table' },
        { name: 'NumPy', icon: 'fa-calculator' }
      ]
    },
    {
      categoryKey: 'vectordb',
      skills: [
        { name: 'Pinecone', icon: 'fa-database' },
        { name: 'Chroma', icon: 'fa-database' },
        { name: 'Embeddings', icon: 'fa-vector-square' }
      ]
    },
    {
      categoryKey: 'integration',
      skills: [
        { name: '.NET Integration', icon: 'fa-plug' },
        { name: 'REST APIs', icon: 'fa-exchange-alt' },
        { name: 'WebSockets', icon: 'fa-broadcast-tower' }
      ]
    }
  ],
  freelance: [
    {
      categoryKey: 'frontend',
      skills: [
        { name: 'Angular', icon: 'fab fa-angular' },
        { name: 'React', icon: 'fab fa-react' },
        { name: 'TypeScript', icon: 'fa-code' },
        { name: 'JavaScript', icon: 'fab fa-js' }
      ]
    },
    {
      categoryKey: 'backend',
      skills: [
        { name: '.NET Core', icon: 'fa-server' },
        { name: 'Node.js', icon: 'fab fa-node' },
        { name: 'Python', icon: 'fab fa-python' },
        { name: 'Docker', icon: 'fab fa-docker' }
      ]
    },
    {
      categoryKey: 'cloud',
      skills: [
        { name: 'AWS', icon: 'fab fa-aws' },
        { name: 'Azure', icon: 'fab fa-microsoft' },
        { name: 'SQL Server', icon: 'fa-database' },
        { name: 'Git', icon: 'fab fa-git-alt' }
      ]
    },
    {
      categoryKey: 'leadership',
      skills: [
        { name: 'Scrum/Agile', icon: 'fa-tasks' },
        { name: 'Code Review', icon: 'fa-search' },
        { name: 'Mentorship', icon: 'fa-user-graduate' },
        { name: 'Architecture', icon: 'fa-sitemap' }
      ]
    }
  ],
  speaker: [
    {
      categoryKey: 'ai',
      skills: [
        { name: 'Prompt Engineering', icon: 'fa-comment-dots' },
        { name: 'ChatGPT/LLMs', icon: 'fa-robot' },
        { name: 'n8n Automation', icon: 'fa-cogs' },
        { name: 'Generative AI', icon: 'fa-brain' }
      ]
    },
    {
      categoryKey: 'programming',
      skills: [
        { name: 'Angular', icon: 'fab fa-angular' },
        { name: 'C# / .NET', icon: 'fa-code' },
        { name: 'Python', icon: 'fab fa-python' },
        { name: 'Databases', icon: 'fa-database' }
      ]
    },
    {
      categoryKey: 'soft',
      skills: [
        { name: 'Public Speaking', icon: 'fa-microphone' },
        { name: 'Didactics', icon: 'fa-chalkboard-teacher' },
        { name: 'Facilitation', icon: 'fa-users' },
        { name: 'Storytelling', icon: 'fa-book-open' }
      ]
    },
    {
      categoryKey: 'formats',
      skills: [
        { name: 'Talks', icon: 'fa-presentation' },
        { name: 'Workshops', icon: 'fa-laptop-code' },
        { name: 'Training', icon: 'fa-graduation-cap' },
        { name: 'Mentoring', icon: 'fa-handshake' }
      ]
    }
  ],
  docente: [
    {
      categoryKey: 'programming',
      skills: [
        { name: 'Python', icon: 'fab fa-python' },
        { name: 'C# / .NET', icon: 'fa-code' },
        { name: 'JavaScript', icon: 'fab fa-js' },
        { name: 'SQL', icon: 'fa-database' }
      ]
    },
    {
      categoryKey: 'ai',
      skills: [
        { name: 'ChatGPT/LLMs', icon: 'fa-robot' },
        { name: 'Prompt Engineering', icon: 'fa-comment-dots' },
        { name: 'AI Tools', icon: 'fa-brain' },
        { name: 'Automation', icon: 'fa-cogs' }
      ]
    },
    {
      categoryKey: 'pedagogy',
      skills: [
        { name: 'Didactics', icon: 'fa-chalkboard-teacher' },
        { name: 'Curriculum Design', icon: 'fa-book' },
        { name: 'Assessment', icon: 'fa-tasks' },
        { name: 'Mentoring', icon: 'fa-user-graduate' }
      ]
    },
    {
      categoryKey: 'tools',
      skills: [
        { name: 'VS Code', icon: 'fa-code' },
        { name: 'Git/GitHub', icon: 'fab fa-github' },
        { name: 'Moodle/LMS', icon: 'fa-graduation-cap' },
        { name: 'Classroom Tools', icon: 'fa-desktop' }
      ]
    }
  ]
};
