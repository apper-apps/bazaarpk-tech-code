/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
theme: {
    extend: {
      spacing: {
        '0.5': '0.125rem',   // 2px
        '1.5': '0.375rem',   // 6px
        '2.5': '0.625rem',   // 10px
        '3.5': '0.875rem',   // 14px
        '4.5': '1.125rem',   // 18px
        '5.5': '1.375rem',   // 22px
        '6.5': '1.625rem',   // 26px
        '7.5': '1.875rem',   // 30px
        '8.5': '2.125rem',   // 34px
        '9.5': '2.375rem',   // 38px
        '15': '3.75rem',     // 60px
        '18': '4.5rem',      // 72px
        '22': '5.5rem',      // 88px
        '26': '6.5rem',      // 104px
        '30': '7.5rem',      // 120px
      },
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
fontSize: {
        // ENHANCED FONT SIZES with integrated typography following Material Design & WCAG 2.1
        'xs': ['0.75rem', { 
          lineHeight: '1.5', 
          letterSpacing: '0.025em', 
          wordSpacing: '0.08em',
          fontFeatureSettings: '"kern" 1'
        }],
        'sm': ['0.875rem', { 
          lineHeight: '1.5', 
          letterSpacing: '0.025em', 
          wordSpacing: '0.08em',
          fontFeatureSettings: '"kern" 1'
        }],
        'base': ['1rem', { 
          lineHeight: '1.65', 
          letterSpacing: '0.025em', 
          wordSpacing: '0.1em',
          fontFeatureSettings: '"kern" 1'
        }],
        'lg': ['1.125rem', { 
          lineHeight: '1.65', 
          letterSpacing: '0.02em', 
          wordSpacing: '0.08em',
          fontFeatureSettings: '"kern" 1'
        }],
        'xl': ['1.25rem', { 
          lineHeight: '1.5', 
          letterSpacing: '0.015em', 
          wordSpacing: '0.06em',
          fontFeatureSettings: '"kern" 1'
        }],
        '2xl': ['1.5rem', { 
          lineHeight: '1.4', 
          letterSpacing: '0.01em', 
          wordSpacing: '0.06em',
          fontFeatureSettings: '"kern" 1'
        }],
        '3xl': ['1.875rem', { 
          lineHeight: '1.3', 
          letterSpacing: '0.005em', 
          wordSpacing: '0.05em',
          fontFeatureSettings: '"kern" 1'
        }],
        '4xl': ['2.25rem', { 
          lineHeight: '1.2', 
          letterSpacing: '0', 
          wordSpacing: '0.05em',
          fontFeatureSettings: '"kern" 1'
        }],
        '5xl': ['3rem', { 
          lineHeight: '1.1', 
          letterSpacing: '-0.01em', 
          wordSpacing: '0.03em',
          fontFeatureSettings: '"kern" 1'
        }],
        '6xl': ['3.75rem', { 
          lineHeight: '1', 
          letterSpacing: '-0.02em', 
          wordSpacing: '0.03em',
          fontFeatureSettings: '"kern" 1'
        }],
      },
      lineHeight: {
        'extra-loose': '2.2',
        'loose': '1.8',
        'relaxed': '1.65',
        'normal': '1.6',
        'snug': '1.4',
        'tight': '1.3',
        'tighter': '1.2',
      },
letterSpacing: {
        'tightest': '-0.075em',
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0.01em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
wordSpacing: {
        // ENHANCED WORD SPACING utilities following typography best practices
        'tight': '0.03em',
        'normal': '0.05em', 
        'relaxed': '0.08em',
        'loose': '0.1em',
        'extra-loose': '0.15em',
        // Additional spacing levels for precise control
        'minimal': '0.02em',
        'comfortable': '0.06em',
        'generous': '0.12em',
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'extra-large': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}