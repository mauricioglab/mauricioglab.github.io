/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
        'error': '#ef4444'
      },
      spacing: {
        '70': '17.5rem',
        '15': '3.75rem'
      }
    },
  },
  plugins: [],
}
