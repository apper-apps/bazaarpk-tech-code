/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F5E8',
          100: '#C8E6C8',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        accent: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        surface: '#FFFFFF',
        background: '#F5F5F5',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}