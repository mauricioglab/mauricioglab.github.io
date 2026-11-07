// Qué claves del i18n `projects-<slug>` alimentan las estadísticas del encabezado y las
// métricas de resultados de cada caso, más su color de acento y si lleva links de demo/GitHub.
export interface CaseStudyConfig {
  stats: string[];
  metrics: string[];
  accent?: 'turquesa' | 'dorado';
  links?: boolean;
}

export const caseStudies: Record<string, CaseStudyConfig> = {
  'abandono-estudiantil': {
    stats: ['alumnos', 'recall', 'auc'],
    metrics: ['recallFull', 'recall1s', 'aucFull', 'umbral'],
    links: true,
  },
  'auditorias-datos': {
    stats: ['eficiencia', 'datos', 'reportes'],
    metrics: ['eficiencia', 'manual', 'datos', 'priorizacion'],
  },
  'billetera-virtual': {
    stats: ['wallets', 'deploy', 'micro'],
    metrics: ['deploy', 'wallets', 'uptime', 'firmas'],
  },
  'coca-cola-embonor': {
    stats: ['errores', 'transacciones', 'responsive'],
    metrics: ['errores', 'transacciones', 'sap', 'acceso'],
  },
  'monitoreo-agricola': {
    stats: ['iot', 'trace', 'realtime'],
    metrics: ['audit', 'trace', 'alertas', 'sync'],
    accent: 'dorado',
  },
  'mundial-2026': {
    stats: ['matches', 'sims', 'semis'],
    metrics: ['logloss', 'baseline', 'aciertos', 'espana'],
    links: true,
  },
  'validacion-biometrica': {
    stats: ['verificaciones', 'precision', 'vida'],
    metrics: ['precision', 'verificaciones', 'trazabilidad', 'produccion'],
  },
};
