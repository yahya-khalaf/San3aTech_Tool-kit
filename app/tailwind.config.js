/** @type {import('tailwindcss').Config} */
// San3a Academy brand theme (brand kit tokens). Colors point at the CSS
// variables in src/san3a-tokens.css where the kit defines them.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#CF2027', // brand-red
          dark: '#A91B24',    // primary-hover
          active: '#781629',  // primary-active (brand-maroon)
          light: '#FBE9EA',   // primary-subtle
        },
        brand: {
          night: '#240D18',
          wine: '#3D1221',
          maroon: '#781629',
          red: '#CF2027',
          plum: '#4B2C38',
        },
        surface: {
          DEFAULT: 'var(--s3-surface)',
          raised: 'var(--s3-surface-raised)',
          sunken: 'var(--s3-surface-sunken)',
        },
        // Neutrals tinted toward brand-night
        gray: {
          50: '#FBF8F9',
          100: '#F7F3F4',
          200: '#EFE8EA',
          300: '#E2D6DA',
          400: '#8C7A80',
          500: '#6B5A60',
          600: '#5C4A51',
          700: '#4B2C38',
          800: '#3D1221',
          900: '#240D18',
        }
      },
      fontFamily: {
        display: ['"Big John"', 'Montserrat', '"Arial Black"', 'sans-serif'],
        heading: ['Arvo', 'Rockwell', 'Georgia', 'serif'],
        body: ['"Myriad Pro"', '"Source Sans 3"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        arabic: ['"GE SS Text"', '"IBM Plex Sans Arabic"', '"Noto Sans Arabic"', 'Tahoma', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Older names kept so nothing loses its font
        montserrat: ['Arvo', 'Rockwell', 'Georgia', 'serif'],
        inter: ['"Myriad Pro"', '"Source Sans 3"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        arvo: ['Arvo', 'Georgia', 'serif'],
      },
      // Square brand corners: cards and tiles 0, buttons and inputs 2px
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        DEFAULT: '2px',
        'md': '4px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
      // The brand is flat; shadows are only for floating UI
      boxShadow: {
        'sm': '0 1px 2px rgba(36,13,24,0.10)',
        DEFAULT: '0 1px 2px rgba(36,13,24,0.10)',
        'md': '0 1px 2px rgba(36,13,24,0.10)',
        'lg': '0 4px 12px rgba(36,13,24,0.14)',
        'xl': '0 4px 12px rgba(36,13,24,0.14)',
        '2xl': '0 12px 32px rgba(36,13,24,0.20)',
      },
      maxWidth: {
        content: '1200px',
      }
    },
  },
  plugins: [],
}
