/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        veil: { light: '#faf5f5', dark: '#191817' },
        ink: '#17160f',
        faint: '#8c8b82',
        accent: '#1e9e52',
        folio: {
          blue: '#3a53ed',
          mute: '#9b9b9b',
          ink: '#060606',
          body: '#434445',
          rule: '#cbc9d6',
        },
      },
      fontFamily: {
        sans: ['MB Sans', 'system-ui', 'sans-serif'],
        mono: ['MB Mono', 'ui-monospace', 'monospace'],
        lcd: ['MB LCD', 'MB Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        colw: '560px',
      },
      maxWidth: {
        intro: '460px',
        col: '560px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.23,1,.32,1)',
      },
    },
  },
  plugins: [],
}
