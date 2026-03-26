import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008060',
          hover: '#006e52',
        },
        interactive: '#003d7c',
        critical: '#d72c0d',
        sale: '#e53e3e',
        text: {
          DEFAULT: '#3a3a3a',
          subdued: '#777777',
        },
        divider: '#ebebeb',
        surface: {
          DEFAULT: '#ffffff',
          subdued: '#fafbfb',
        },
        bg: {
          DEFAULT: '#ffffff',
          alt: '#fafbfb',
        },
        // Backwards compat aliases
        brand: {
          cream: '#fafbfb',
          peach: '#008060',
          'orange-light': '#008060',
          orange: '#008060',
          'orange-deep': '#006e52',
          'brown-dark': '#3a3a3a',
          'brown-medium': '#777777',
        },
      },
      borderRadius: {
        btn: '3px',
        card: '6px',
      },
      maxWidth: {
        'page-width': '1200px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
