import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override ALL font sizes so minimum = 14px (0.875rem)
    fontSize: {
      'xs':   ['0.875rem', { lineHeight: '1.375rem' }],  // 14px
      'sm':   ['0.9375rem', { lineHeight: '1.5rem' }],   // 15px
      'base': ['1rem',      { lineHeight: '1.625rem' }],  // 16px
      'lg':   ['1.125rem',  { lineHeight: '1.75rem' }],  // 18px
      'xl':   ['1.25rem',   { lineHeight: '1.875rem' }], // 20px
      '2xl':  ['1.5rem',    { lineHeight: '2rem' }],     // 24px
      '3xl':  ['1.875rem',  { lineHeight: '2.375rem' }], // 30px
      '4xl':  ['2.25rem',   { lineHeight: '2.75rem' }],  // 36px
      '5xl':  ['3rem',      { lineHeight: '1.1' }],       // 48px
      '6xl':  ['3.75rem',   { lineHeight: '1.1' }],       // 60px
    },
    extend: {
      colors: {
        bg:              '#FDF6F0',
        tag:             '#F5E0D4',
        primary:         '#D4906A',
        accent:          '#B06840',
        ink:             '#2E1A10',
        'primary-light': '#EBCBB8',
        'primary-dark':  '#B06840',
        'ink-light':     '#7A5040',
        'ink-muted':     '#A08070',
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
