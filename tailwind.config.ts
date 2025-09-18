import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-bright': 'pulse-bright 2s ease-out',
      },
      keyframes: {
        'pulse-bright': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(250, 204, 21, 0.7)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 10px 15px rgba(250, 204, 21, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
