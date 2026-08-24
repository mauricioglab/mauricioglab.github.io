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
  engineer: [
    {
      categoryKey: 'backend',
      skills: [
        { name: '.NET Core', icon: 'fa-code' },
        { name: 'C#', icon: 'fa-code' },
        { name: 'ASP.NET', icon: 'fa-code' },
        { name: 'Entity Framework', icon: 'fa-database' },
        { name: 'Node.js / NestJS', icon: 'fab fa-node' }
      ]
    },
    {
      categoryKey: 'frontend',
      skills: [
        { name: 'Angular', icon: 'fab fa-angular' },
        { name: 'TypeScript', icon: 'fa-code' },
        { name: 'React / React Native', icon: 'fab fa-react' }
      ]
    },
    {
      categoryKey: 'ai-data',
      skills: [
        { name: 'Python', icon: 'fab fa-python' },
        { name: 'Pandas', icon: 'fa-table' },
        { name: 'scikit-learn', icon: 'fa-brain' },
        { name: 'statsmodels', icon: 'fa-chart-line' },
        { name: 'SQL', icon: 'fa-database' },
        { name: 'Streamlit / Plotly', icon: 'fa-chart-bar' },
        { name: 'Power BI', icon: 'fa-chart-pie' },
        { name: 'AWS Rekognition', icon: 'fab fa-aws' }
      ]
    },
    {
      categoryKey: 'cloud-architecture',
      skills: [
        { name: 'AWS (S3, Lambda, QLDB)', icon: 'fab fa-aws' },
        { name: 'Docker', icon: 'fab fa-docker' },
        { name: 'Amazon ECS', icon: 'fa-server' },
        { name: 'CI/CD', icon: 'fa-infinity' },
        { name: 'DDD / CQRS', icon: 'fa-cube' },
        { name: 'Microservicios', icon: 'fa-cubes' }
      ]
    }
  ]
};
