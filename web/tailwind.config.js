/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light SaaS / HackerRank inspired colors
        'dark-bg': '#ffffff',        // Renamed to dark-bg just to avoid rewriting all components, but it's now white
        'dark-surface': '#f4f5f7',   // Light gray surfaces
        'dark-surface-hover': '#e5e7eb', // Slightly darker gray for hovers
        'dark-border': '#d1d5db',    // Soft gray borders
        
        // Brand Colors
        'brand-primary': '#1BA94C',  // Core CodersWorld / HackerRank Green
        'brand-primary-hover': '#15873C',
        'brand-secondary': '#0e1111',// Almost black for heavy contrast elements
        'brand-accent': '#28a745',   // Highlight green
        'brand-warning': '#f5a623',  // Warning amber
        'brand-danger': '#d32f2f',   // Crisp Error Red
        
        // Text Colors
        'text-primary': '#1e293b',   // Dark slate for main text (softer than black)
        'text-secondary': '#475569', // Medium gray for subtitles
        'text-tertiary': '#64748b',  // Light gray for meta text
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      boxShadow: {
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'glass-glow': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'glow-primary': '0 4px 14px 0 rgba(27, 169, 76, 0.25)',
        'glow-secondary': '0 4px 14px 0 rgba(14, 17, 17, 0.15)',
      },
    },
  },
  plugins: [],
}
