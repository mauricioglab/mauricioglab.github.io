/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#141414',
        'bg-tertiary': '#1a1a1a',
        'border-primary': '#2a2a2a',
        'text-primary': '#ffffff',
        'text-secondary': '#d1d5db',
        'text-muted': '#9ca3af',
        'accent': '#6366f1',
        'accent-hover': '#4f46e5',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        // Paleta del caso de estudio "Analista de Sistemas" (src/pages/caso-arquitectura/).
        // `teal` acá es un color plano propio de ese sub-sitio, no la escala teal-50..950
        // de Tailwind — verificado que nada más en el repo usa teal-NNN, así que no rompe nada.
        'ink': '#23221d',
        'ink-soft': '#5b594c',
        'ink-faint': '#6b6858',
        'paper': '#faf8f2',
        'paper-alt': '#f2ecdc',
        'sand': '#cdbd8f',
        'sand-deep': '#7a5f2b',
        'teal': '#2f9d95',
        'teal-deep': '#1f6f69',
        'teal-tint': '#e3f2f0',
        'line': '#e4dcc6',
        'card': '#ffffff',
        'navy': '#1b2430',
        'header-bg': 'rgba(250, 248, 242, 0.96)',
        'diagram-gold': '#a9955f',
        'diagram-gold-text': '#8a7a4a',
        'diagram-gold-line': '#d8cba0',
        'diagram-gold-dashed': '#c9bb8e',
        'diagram-rose': '#c76b70',
        'diagram-rose-tint': '#fbe9ea',
        'diagram-rose-text': '#a34a4f',
        'diagram-indigo': '#5b6bb0',
        'diagram-indigo-tint': '#eef1fb',
        'diagram-indigo-text': '#3d4a8a',
        'diagram-text-muted': '#6b6a63'
      },
      fontFamily: {
        head: ["'Space Grotesk'", "'Inter'", 'system-ui', 'sans-serif'],
        body: ["'Inter'", 'system-ui', 'sans-serif']
      },
      borderRadius: {
        default: '14px'
      },
      boxShadow: {
        default: '0 20px 40px -24px rgba(35, 34, 29, 0.35)'
      },
      spacing: {
        '70': '17.5rem',
        '15': '3.75rem',
        // Valores adicionales usados por el caso de estudio de arquitectura
        // (Tailwind v4 origen tiene una escala numérica más granular que v3).
        '2.25': '0.5625rem',
        '2.75': '0.6875rem',
        '3.25': '0.8125rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem'
      },
      opacity: {
        '28': '0.28'
      },
      zIndex: {
        '1': '1'
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-600', 'text-blue-600', 'border-blue-600', 'hover:bg-blue-600',
    'bg-slate-900', 'text-slate-900', 'border-slate-900', 'hover:bg-slate-900',
    'bg-emerald-600', 'text-emerald-600', 'border-emerald-600', 'hover:bg-emerald-600',
    'bg-teal-600', 'text-teal-600', 'border-teal-600', 'hover:bg-teal-600',
    'bg-teal-100', 'text-teal-500', 'bg-teal-500',
    'bg-white', 'bg-slate-50', 'bg-slate-950', 'bg-slate-900',
    'text-white', 'text-slate-100', 'text-slate-400',
    'border-slate-200', 'border-slate-800'
  ]
}
