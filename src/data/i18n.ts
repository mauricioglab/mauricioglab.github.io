// Traducciones para los landing pages

export type Lang = 'es' | 'en';

export interface Translations {
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
    downloadCV: string;
    sendEmail: string;
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

export const translations: Record<Lang, Translations> = {
  es: {
    nav: {
      projects: 'Proyectos',
      skills: 'Skills',
      experience: 'Experiencia',
      blog: 'Blog',
      contact: 'Contacto'
    },
    hero: {
      yearsExp: '+5 Años de Experiencia',
      yearsExpSub: 'Proyectos enterprise y startups',
      location: 'Remoto / Híbrido',
      locationSub: 'Argentina (GMT-3)',
      availability: 'Disponibilidad Inmediata',
      availabilitySub: 'Full-time o proyectos'
    },
    sections: {
      featuredProjects: 'Proyectos Destacados',
      techStack: 'Stack Técnico',
      experience: 'Experiencia',
      methodology: 'Mi Metodología',
      background: 'Background Técnico'
    },
    cta: {
      downloadCV: 'Descargar CV',
      sendEmail: 'Enviar Email',
      connectLinkedIn: 'Conectar en LinkedIn',
      viewRepos: 'Ver Repositorios'
    },
    footer: {
      links: 'Enlaces',
      contact: 'Contacto',
      rights: 'Todos los derechos reservados.'
    },
    theme: {
      light: 'Claro',
      dark: 'Oscuro'
    }
  },
  en: {
    nav: {
      projects: 'Projects',
      skills: 'Skills',
      experience: 'Experience',
      blog: 'Blog',
      contact: 'Contact'
    },
    hero: {
      yearsExp: '+5 Years of Experience',
      yearsExpSub: 'Enterprise projects and startups',
      location: 'Remote / Hybrid',
      locationSub: 'Argentina (GMT-3)',
      availability: 'Immediate Availability',
      availabilitySub: 'Full-time or projects'
    },
    sections: {
      featuredProjects: 'Featured Projects',
      techStack: 'Tech Stack',
      experience: 'Experience',
      methodology: 'My Methodology',
      background: 'Technical Background'
    },
    cta: {
      downloadCV: 'Download CV',
      sendEmail: 'Send Email',
      connectLinkedIn: 'Connect on LinkedIn',
      viewRepos: 'View Repositories'
    },
    footer: {
      links: 'Links',
      contact: 'Contact',
      rights: 'All rights reserved.'
    },
    theme: {
      light: 'Light',
      dark: 'Dark'
    }
  }
};

// Profile-specific content
export interface ProfileContent {
  title: string;
  subtitle: string;
  description: string;
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
  experience: {
    role1: string;
    company1: string;
    items1: string[];
    role2: string;
    company2: string;
    items2: string[];
  };
}

export const profileContent: Record<Lang, Record<string, ProfileContent>> = {
  es: {
    developer: {
      title: 'Full-Stack Developer',
      subtitle: '.NET + Angular',
      description: 'Construyo sistemas enterprise que escalan',
      hero: {
        badge: 'DISPONIBLE PARA PROYECTOS ENTERPRISE',
        headline: 'Desarrollo Soluciones que <span class="text-blue-600 dark:text-blue-400">Escalan</span>.',
        subheadline: 'Full-Stack Developer con +5 años construyendo arquitecturas robustas en .NET y Angular. Del diseño a producción, entrego sistemas que soportan carga real.',
        ctaPrimary: 'Descargar CV Developer',
        ctaSecondary: 'Ver Proyectos'
      },
      projectsDescription: 'Sistemas enterprise que soportan carga real. Arquitecturas robustas con .NET, Angular y SQL Server.',
      ctaTitle: '¿Buscás un Developer que entregue resultados?',
      ctaDescription: 'Hablemos de tu proyecto. Puedo empezar de inmediato.',
      experience: {
        role1: 'Senior Full-Stack Developer',
        company1: 'Empresa Tech | 2021 - Presente',
        items1: [
          'Lideré migración de monolito a microservicios (8 servicios, 0 downtime)',
          'Reducción del 60% en tiempos de respuesta mediante optimización de queries SQL',
          'Implementación de CI/CD con GitHub Actions y Azure DevOps'
        ],
        role2: 'Full-Stack Developer',
        company2: 'Consultora IT | 2019 - 2021',
        items2: [
          'Desarrollo de 5+ aplicaciones enterprise con .NET Core y Angular',
          'Implementación de arquitectura limpia y patrones SOLID'
        ]
      }
    },
    analista: {
      title: 'Analista de Sistemas',
      subtitle: 'Arquitectura & Estrategia',
      description: 'Del relevamiento al código',
      hero: {
        badge: 'TÍTULO FORMAL: ANALISTA DE SISTEMAS',
        headline: 'Diseño Arquitecturas que <span class="text-slate-900 dark:text-slate-100">Escalan</span> y Solucionan.',
        subheadline: 'Analista de Sistemas con fuerte perfil técnico. No solo diseño modelos y procesos: entiendo el código detrás de ellos. +5 años transformando requerimientos de negocio en sistemas robustos.',
        ctaPrimary: 'Descargar CV Analista',
        ctaSecondary: 'Ver Casos de Diseño'
      },
      projectsDescription: 'Del relevamiento al modelo de dominio. Arquitecturas que resuelven problemas de negocio complejos.',
      ctaTitle: '¿Necesitás diseñar una arquitectura sólida?',
      ctaDescription: 'Puedo ayudarte a transformar requerimientos complejos en sistemas escalables.',
      methodology: {
        title1: '1. Relevamiento',
        desc1: 'Entrevistas con stakeholders, análisis de procesos actuales y documentación de pain points. Uso de técnicas como Event Storming y User Story Mapping.',
        title2: '2. Diseño',
        desc2: 'Modelado de dominio con DDD, definición de bounded contexts y diseño de arquitectura. Diagramas UML, C4 y documentación técnica completa.',
        title3: '3. Validación',
        desc3: 'Revisión técnica con el equipo de desarrollo, validación de factibilidad y ajustes iterativos. Aseguro que el diseño sea implementable.'
      },
      experience: {
        role1: 'Analista de Sistemas Senior',
        company1: 'Empresa Tech | 2021 - Presente',
        items1: [
          'Diseño de arquitectura para 3 sistemas enterprise (DDD + Microservicios)',
          'Reducción del 40% en deuda técnica mediante refactoring arquitectónico',
          'Facilitación de workshops de Event Storming con equipos multidisciplinarios'
        ],
        role2: 'Analista Funcional',
        company2: 'Consultora IT | 2019 - 2021',
        items2: [
          'Relevamiento y documentación de requerimientos para 8+ proyectos',
          'Modelado de procesos de negocio con BPMN y casos de uso UML'
        ]
      }
    },
    'ia-engineer': {
      title: 'IA Engineer',
      subtitle: 'Python & LLMs',
      description: 'Integrando IA en sistemas reales',
      hero: {
        badge: 'ESPECIALIZACIÓN ACTIVA EN IA & LLMs',
        headline: 'Integrando <span class="text-emerald-500">Inteligencia</span> en Sistemas Reales.',
        subheadline: 'Full-Stack Developer (.NET/Angular) con +5 años de experiencia, ahora enfocado en construir soluciones con Python, LangChain y RAGs. Uniendo la robustez del software enterprise con el poder de la IA generativa.',
        ctaPrimary: 'Descargar CV IA Engineer',
        ctaSecondary: 'Ver Repositorios IA'
      },
      projectsDescription: 'Integrando LLMs y RAG en sistemas enterprise. Python, LangChain y arquitecturas escalables.',
      ctaTitle: '¿Querés integrar IA en tu sistema?',
      ctaDescription: 'Combino experiencia enterprise con las últimas tecnologías de IA. Hablemos de tu proyecto.',
      background: {
        title1: '+5 Años en .NET/Angular',
        desc1: 'No soy un data scientist que aprendió a programar. Soy un developer enterprise que ahora domina IA. Entiendo arquitecturas, APIs, bases de datos y deployment.',
        title2: 'Especialización en IA',
        desc2: 'Desde 2023 trabajando con LLMs, RAG y LangChain. Integro modelos de IA en sistemas existentes sin romper nada. Python production-ready.'
      },
      experience: {
        role1: 'IA Engineer / Full-Stack Developer',
        company1: 'Empresa Tech | 2023 - Presente',
        items1: [
          'Desarrollo de chatbot RAG que redujo 70% de consultas manuales',
          'Pipeline de extracción de datos con LLMs (95% de precisión)',
          'Integración de Python/FastAPI con sistemas .NET legacy'
        ],
        role2: 'Senior Full-Stack Developer',
        company2: 'Empresa Tech | 2019 - 2023',
        items2: [
          'Arquitecturas enterprise con .NET Core y Angular',
          'Microservicios, CQRS y Event Sourcing'
        ]
      }
    },
    freelance: {
      title: 'Tech Lead Freelance',
      subtitle: 'Fullstack & Consultoría',
      description: 'Escalo startups de 0 a producción',
      hero: {
        badge: 'DISPONIBLE PARA PROYECTOS Y CONSULTORÍA',
        headline: 'Escalo Startups de <span class="text-orange-600 dark:text-orange-400">0 a Producción</span>.',
        subheadline: 'Tech Lead & Desarrollador Fullstack con +10 años de experiencia. 50+ proyectos entregados, 15+ equipos liderados. Angular, .NET, Node.js, AWS.',
        ctaPrimary: 'Agendar Consultoría',
        ctaSecondary: 'Ver Proyectos'
      },
      projectsDescription: 'Proyectos entregados que generaron impacto real. Desde MVPs hasta sistemas enterprise escalables.',
      ctaTitle: '¿Necesitás escalar tu proyecto?',
      ctaDescription: 'Puedo ayudarte como Tech Lead, consultor o desarrollador. Hablemos de tu desafío.',
      services: {
        title1: 'Liderazgo de Equipo',
        desc1: 'Gestión de equipos técnicos, arquitectura de soluciones y mentoría de desarrolladores junior y senior.',
        title2: 'Desarrollo Fullstack',
        desc2: 'Angular, .NET Core, Node.js, Python. Desde el frontend hasta la base de datos, entrego soluciones completas.',
        title3: 'Consultoría Técnica',
        desc3: 'Auditorías de código, definición de arquitectura, optimización de performance y migración de sistemas legacy.'
      },
      experience: {
        role1: 'Líder de Equipo Senior',
        company1: 'Empresa Tech | 2024 - Presente',
        items1: [
          'Reducción del 40% en tiempo de desarrollo del equipo',
          'Liderazgo de 8 desarrolladores en proyectos críticos',
          'Migración de 10+ sistemas legacy a arquitecturas modernas'
        ],
        role2: 'Desarrollador Fullstack Senior',
        company2: 'Proyectos Freelance | 2019 - 2024',
        items2: [
          '15+ APIs desarrolladas para clientes enterprise',
          'Mejora del 60% en performance de aplicaciones existentes',
          '5+ proyectos cloud desplegados en AWS y Azure'
        ]
      }
    },
    speaker: {
      title: 'Speaker & Docente',
      subtitle: 'IA & Programación',
      description: 'Transformo tecnología compleja en conocimiento práctico',
      hero: {
        badge: 'DISPONIBLE PARA CHARLAS Y CAPACITACIONES',
        headline: 'Hago que la <span class="text-purple-600 dark:text-purple-400">Tecnología</span> sea Comprensible.',
        subheadline: 'Docente con +10 años de experiencia, +500 estudiantes capacitados. Especialista en IA, programación y tecnologías emergentes. Charlas que inspiran y capacitaciones que transforman.',
        ctaPrimary: 'Contratar Charla',
        ctaSecondary: 'Ver Experiencia'
      },
      projectsDescription: 'Charlas y capacitaciones que transforman equipos y organizaciones.',
      ctaTitle: '¿Querés capacitar a tu equipo?',
      ctaDescription: 'Ofrezco charlas inspiracionales, workshops prácticos y capacitaciones in-company.',
      topics: {
        title1: 'Inteligencia Artificial Práctica',
        desc1: 'Cómo usar IA en tu trabajo diario. Prompt Engineering, automatizaciones con n8n, integración de LLMs en sistemas existentes.',
        title2: 'Desarrollo & Arquitectura',
        desc2: 'Clean Architecture, microservicios, buenas prácticas. Angular, .NET, Python para equipos que quieren mejorar.',
        title3: 'Liderazgo Técnico',
        desc3: 'Cómo liderar equipos de desarrollo, gestionar deuda técnica y tomar decisiones arquitectónicas.'
      },
      experience: {
        role1: 'Docente Universitario',
        company1: 'Instituciones Educativas | 2024 - Presente',
        items1: [
          'Materias: Práctica Profesionalizante, Intro a Programación, Bases de Datos',
          'Carreras: Técnico en Análisis de Sistemas, Desarrollo Web, IA',
          '+50 charlas y talleres realizados'
        ],
        role2: 'Capacitador Corporativo',
        company2: 'Empresas Tech | 2019 - Presente',
        items2: [
          '+500 estudiantes capacitados en programación y tecnología',
          'Workshops de IA y automatización para equipos enterprise',
          'Mentorías personalizadas para developers'
        ]
      }
    }
  },
  en: {
    developer: {
      title: 'Full-Stack Developer',
      subtitle: '.NET + Angular',
      description: 'I build enterprise systems that scale',
      hero: {
        badge: 'AVAILABLE FOR ENTERPRISE PROJECTS',
        headline: 'I Build Solutions that <span class="text-blue-600 dark:text-blue-400">Scale</span>.',
        subheadline: 'Full-Stack Developer with 5+ years building robust architectures in .NET and Angular. From design to production, I deliver systems that handle real load.',
        ctaPrimary: 'Download Developer CV',
        ctaSecondary: 'View Projects'
      },
      projectsDescription: 'Enterprise systems that handle real load. Robust architectures with .NET, Angular and SQL Server.',
      ctaTitle: 'Looking for a Developer who delivers results?',
      ctaDescription: "Let's talk about your project. I can start immediately.",
      experience: {
        role1: 'Senior Full-Stack Developer',
        company1: 'Tech Company | 2021 - Present',
        items1: [
          'Led monolith to microservices migration (8 services, 0 downtime)',
          '60% reduction in response times through SQL query optimization',
          'CI/CD implementation with GitHub Actions and Azure DevOps'
        ],
        role2: 'Full-Stack Developer',
        company2: 'IT Consulting | 2019 - 2021',
        items2: [
          'Development of 5+ enterprise applications with .NET Core and Angular',
          'Clean architecture and SOLID patterns implementation'
        ]
      }
    },
    analista: {
      title: 'Systems Analyst',
      subtitle: 'Architecture & Strategy',
      description: 'From requirements to code',
      hero: {
        badge: 'FORMAL DEGREE: SYSTEMS ANALYST',
        headline: 'I Design Architectures that <span class="text-slate-900 dark:text-slate-100">Scale</span> and Solve.',
        subheadline: 'Systems Analyst with strong technical profile. I not only design models and processes: I understand the code behind them. 5+ years transforming business requirements into robust systems.',
        ctaPrimary: 'Download Analyst CV',
        ctaSecondary: 'View Design Cases'
      },
      projectsDescription: 'From requirements to domain model. Architectures that solve complex business problems.',
      ctaTitle: 'Need to design a solid architecture?',
      ctaDescription: 'I can help you transform complex requirements into scalable systems.',
      methodology: {
        title1: '1. Discovery',
        desc1: 'Stakeholder interviews, current process analysis and pain points documentation. Using techniques like Event Storming and User Story Mapping.',
        title2: '2. Design',
        desc2: 'Domain modeling with DDD, bounded contexts definition and architecture design. UML diagrams, C4 and complete technical documentation.',
        title3: '3. Validation',
        desc3: 'Technical review with development team, feasibility validation and iterative adjustments. I ensure the design is implementable.'
      },
      experience: {
        role1: 'Senior Systems Analyst',
        company1: 'Tech Company | 2021 - Present',
        items1: [
          'Architecture design for 3 enterprise systems (DDD + Microservices)',
          '40% reduction in technical debt through architectural refactoring',
          'Event Storming workshop facilitation with multidisciplinary teams'
        ],
        role2: 'Functional Analyst',
        company2: 'IT Consulting | 2019 - 2021',
        items2: [
          'Requirements gathering and documentation for 8+ projects',
          'Business process modeling with BPMN and UML use cases'
        ]
      }
    },
    'ia-engineer': {
      title: 'AI Engineer',
      subtitle: 'Python & LLMs',
      description: 'Integrating AI into real systems',
      hero: {
        badge: 'ACTIVE SPECIALIZATION IN AI & LLMs',
        headline: 'Integrating <span class="text-emerald-500">Intelligence</span> into Real Systems.',
        subheadline: 'Full-Stack Developer (.NET/Angular) with 5+ years of experience, now focused on building solutions with Python, LangChain and RAGs. Combining enterprise software robustness with generative AI power.',
        ctaPrimary: 'Download AI Engineer CV',
        ctaSecondary: 'View AI Repositories'
      },
      projectsDescription: 'Integrating LLMs and RAG into enterprise systems. Python, LangChain and scalable architectures.',
      ctaTitle: 'Want to integrate AI into your system?',
      ctaDescription: "I combine enterprise experience with the latest AI technologies. Let's talk about your project.",
      background: {
        title1: '+5 Years in .NET/Angular',
        desc1: "I'm not a data scientist who learned to code. I'm an enterprise developer who now masters AI. I understand architectures, APIs, databases and deployment.",
        title2: 'AI Specialization',
        desc2: 'Since 2023 working with LLMs, RAG and LangChain. I integrate AI models into existing systems without breaking anything. Production-ready Python.'
      },
      experience: {
        role1: 'AI Engineer / Full-Stack Developer',
        company1: 'Tech Company | 2023 - Present',
        items1: [
          'RAG chatbot development that reduced 70% of manual queries',
          'Data extraction pipeline with LLMs (95% accuracy)',
          'Python/FastAPI integration with .NET legacy systems'
        ],
        role2: 'Senior Full-Stack Developer',
        company2: 'Tech Company | 2019 - 2023',
        items2: [
          'Enterprise architectures with .NET Core and Angular',
          'Microservices, CQRS and Event Sourcing'
        ]
      }
    },
    freelance: {
      title: 'Freelance Tech Lead',
      subtitle: 'Fullstack & Consulting',
      description: 'I scale startups from 0 to production',
      hero: {
        badge: 'AVAILABLE FOR PROJECTS AND CONSULTING',
        headline: 'I Scale Startups from <span class="text-orange-600 dark:text-orange-400">0 to Production</span>.',
        subheadline: 'Tech Lead & Fullstack Developer with 10+ years of experience. 50+ projects delivered, 15+ teams led. Angular, .NET, Node.js, AWS.',
        ctaPrimary: 'Schedule Consultation',
        ctaSecondary: 'View Projects'
      },
      projectsDescription: 'Delivered projects that generated real impact. From MVPs to scalable enterprise systems.',
      ctaTitle: 'Need to scale your project?',
      ctaDescription: "I can help as Tech Lead, consultant or developer. Let's talk about your challenge.",
      services: {
        title1: 'Team Leadership',
        desc1: 'Technical team management, solution architecture and mentorship for junior and senior developers.',
        title2: 'Fullstack Development',
        desc2: 'Angular, .NET Core, Node.js, Python. From frontend to database, I deliver complete solutions.',
        title3: 'Technical Consulting',
        desc3: 'Code audits, architecture definition, performance optimization and legacy system migration.'
      },
      experience: {
        role1: 'Senior Team Lead',
        company1: 'Tech Company | 2024 - Present',
        items1: [
          '40% reduction in team development time',
          'Leadership of 8 developers on critical projects',
          'Migration of 10+ legacy systems to modern architectures'
        ],
        role2: 'Senior Fullstack Developer',
        company2: 'Freelance Projects | 2019 - 2024',
        items2: [
          '15+ APIs developed for enterprise clients',
          '60% performance improvement on existing applications',
          '5+ cloud projects deployed on AWS and Azure'
        ]
      }
    },
    speaker: {
      title: 'Speaker & Educator',
      subtitle: 'AI & Programming',
      description: 'I transform complex technology into practical knowledge',
      hero: {
        badge: 'AVAILABLE FOR TALKS AND TRAINING',
        headline: 'I Make <span class="text-purple-600 dark:text-purple-400">Technology</span> Understandable.',
        subheadline: 'Educator with 10+ years of experience, 500+ students trained. Specialist in AI, programming and emerging technologies. Talks that inspire and training that transforms.',
        ctaPrimary: 'Book a Talk',
        ctaSecondary: 'View Experience'
      },
      projectsDescription: 'Talks and training that transform teams and organizations.',
      ctaTitle: 'Want to train your team?',
      ctaDescription: 'I offer inspirational talks, practical workshops and in-company training.',
      topics: {
        title1: 'Practical AI',
        desc1: 'How to use AI in your daily work. Prompt Engineering, n8n automations, LLM integration into existing systems.',
        title2: 'Development & Architecture',
        desc2: 'Clean Architecture, microservices, best practices. Angular, .NET, Python for teams that want to improve.',
        title3: 'Technical Leadership',
        desc3: 'How to lead development teams, manage technical debt and make architectural decisions.'
      },
      experience: {
        role1: 'University Educator',
        company1: 'Educational Institutions | 2024 - Present',
        items1: [
          'Subjects: Professional Practice, Intro to Programming, Databases',
          'Programs: Systems Analysis Technician, Web Development, AI',
          '50+ talks and workshops delivered'
        ],
        role2: 'Corporate Trainer',
        company2: 'Tech Companies | 2019 - Present',
        items2: [
          '500+ students trained in programming and technology',
          'AI and automation workshops for enterprise teams',
          'Personalized mentoring for developers'
        ]
      }
    }
  }
};
