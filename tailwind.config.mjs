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
        // Paleta de marca VeloCityLab (Home, CV, Blog, Servicios, Zona Lab, Portfolio).
        // Prefijo `vcl-` para no colisionar con las claves planas de arriba.
        'vcl-petroleo': '#082D3A',
        'vcl-turquesa': '#16B6C9',
        'vcl-cian': '#7DE3FF',
        'vcl-dorado': '#D4AF37',
        'vcl-navy': '#0A1E28'
      },
      fontFamily: {
        head: ["'Space Grotesk'", "'Inter'", 'system-ui', 'sans-serif'],
        body: ["'Inter'", 'system-ui', 'sans-serif'],
        vclHead: ["'Montserrat'", 'system-ui', 'sans-serif'],
        vclBody: ["'Montserrat'", 'system-ui', 'sans-serif']
      },
      borderRadius: {
        default: '14px'
      },
      boxShadow: {
        default: '0 20px 40px -24px rgba(35, 34, 29, 0.35)'
      },
      spacing: {
        '70': '17.5rem',
        '15': '3.75rem'
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
    'border-slate-200', 'border-slate-800',
    'bg-vcl-petroleo', 'text-vcl-petroleo', 'border-vcl-petroleo', 'hover:bg-vcl-petroleo',
    'bg-vcl-turquesa', 'text-vcl-turquesa', 'border-vcl-turquesa', 'hover:bg-vcl-turquesa',
    'bg-vcl-cian', 'text-vcl-cian', 'border-vcl-cian',
    'bg-vcl-dorado', 'text-vcl-dorado', 'border-vcl-dorado', 'hover:bg-vcl-dorado',
    'bg-vcl-navy', 'text-vcl-navy', 'border-vcl-navy'
  ]
}
