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
        brand: {
          cream: '#F5DEB3',
          peach: '#EDBA7A',
          'orange-light': '#E8A54B',
          orange: '#E88B2D',
          'orange-deep': '#D4691A',
          'brown-dark': '#5B2C0E',
          'brown-medium': '#7A3D12',
        },
        bg: {
          DEFAULT: '#FAFAF8',
          alt: '#F5F0EB',
        },
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
