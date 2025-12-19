import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        border: '#e2e8f0',
        'user-message': '#2563eb',
        'ai-message': '#f1f5f9',
      },
    },
  },
  plugins: [],
} satisfies Config;
