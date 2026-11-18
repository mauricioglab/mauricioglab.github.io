// Caso de ejemplo del tipo «analista» de ESTE sitio (lo usan CaseModal, AnalystCaseOverview y CasesModule, que son idénticos en ambos portales).
import { CASE_CARDS } from './case-meta';
import { MGD_SLUG, mgdAnalystSections, mgdDiagramCrops } from './mgd-analyst';

export const SAMPLE_SLUG: string | null = MGD_SLUG;
export const sampleSections = mgdAnalystSections;
export const sampleCrops = mgdDiagramCrops;
export const sampleCard: { title: string; context: string } | null = { title: CASE_CARDS[MGD_SLUG].title, context: CASE_CARDS[MGD_SLUG].context };
