/**
 * Case Study Components
 * Reusable components for project case study pages
 */

// Component exports
export { default as CaseStudyHeader } from './CaseStudyHeader.astro';
export { default as ProblemSection } from './ProblemSection.astro';
export { default as ProcessTimeline } from './ProcessTimeline.astro';
export { default as SolutionSection } from './SolutionSection.astro';
export { default as MetricsGrid } from './MetricsGrid.astro';
export { default as TechStack } from './TechStack.astro';
export { default as CaseStudyCTA } from './CaseStudyCTA.astro';

// Type exports
export type { Stat, Link } from './CaseStudyHeader.astro';
export type { Phase } from './ProcessTimeline.astro';
export type { Metric } from './MetricsGrid.astro';
export type { StackColumn } from './TechStack.astro';
export type { SolutionItem, SolutionSubsection } from './SolutionSection.astro';
