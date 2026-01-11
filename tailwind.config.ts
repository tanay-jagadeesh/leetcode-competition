import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Professional blue
        secondary: '#1e40af', // Darker blue
        accent: '#10b981', // Success green
        warning: '#f59e0b', // Warm orange
        dark: {
          50: '#1f2937',
          100: '#111827',
          200: '#0f172a',
          300: '#020617',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)',
          },
          '50%': {
            opacity: '0.95',
            boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
