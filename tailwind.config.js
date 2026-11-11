/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Gilroy-Medium', 'Gilroy', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'gilroy': ['Gilroy', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'gilroy-medium': ['Gilroy-Medium', 'Gilroy', 'Montserrat', 'sans-serif'],
        'metropolis': ['Metropolis', 'Montserrat', 'sans-serif'],
        'subheading': ['Fredoka', 'sans-serif'],
        'body': ['Gilroy', 'Gilroy-Medium', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
        },
        secondary: {
          500: '#764ba2',
        },
        gray: {
          850: '#1a1a1a',
          950: '#0a0a0a',
        }
      },
      boxShadow: {
        'smooth': '0 2px 20px rgba(0, 0, 0, 0.06)',
        'smooth-lg': '0 4px 30px rgba(0, 0, 0, 0.08)',
        'smooth-xl': '0 8px 40px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
