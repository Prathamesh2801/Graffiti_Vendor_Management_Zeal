/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:      'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark':  'var(--color-primary-dark)',
        'primary-50':    'var(--color-primary-50)',
        secondary:    'var(--color-secondary)',
        accent:       'var(--color-accent)',
        complement:   'var(--color-complement)',
        analogous1:   'var(--color-analogous-1)',
        analogous2:   'var(--color-analogous-2)',
        analogous3:   'var(--color-analogous-3)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'bg-page':    'var(--color-bg)',
        'bg-surface': 'var(--color-bg-secondary)',
        'bg-card':    'var(--color-bg-card)',
        success:      'var(--color-success)',
        warning:      'var(--color-warning)',
        danger:       'var(--color-error)',
      },
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [],
}