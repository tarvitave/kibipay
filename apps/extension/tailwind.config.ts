import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#85aaff',
          400: '#487aff',
          500: '#1a4fff',
          600: '#0030f5',
          700: '#0022d1',
          800: '#001ea8',
          900: '#001b85',
        },
      },
      width: { popup: '360px' },
      height: { popup: '600px' },
    },
  },
  plugins: [],
};

export default config;
