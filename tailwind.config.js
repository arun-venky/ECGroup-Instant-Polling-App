/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Canva-like fresh, modern palette
        primary: '#00C4CC',      // Teal
        accent: '#8B5CF6',       // Vivid purple
        dark: '#1F2937',         // Slate for headings on light bg
        secondary: '#2F80ED',    // Bright blue
        neutral: '#374151',      // Gray-700 for body text
        background: '#F9FAFB',   // Very light gray background
      },
      backgroundImage: {
        'bar-gradient': 'linear-gradient(90deg, #00C4CC, #2F80ED)',
        'pie-gradient': 'radial-gradient(#00C4CC, #8B5CF6)',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.05)' },
        },
      },
      animation: {
        wave: 'wave 5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
}


