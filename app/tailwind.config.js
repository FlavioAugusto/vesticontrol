/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ef',
          100: '#f9edcf',
          200: '#f3d99e',
          300: '#ecbf65',
          400: '#e5a43a',
          DEFAULT: '#b89155',
          600: '#9a7340',
          700: '#7a5a31',
          800: '#5c4224',
          900: '#3a2914',
        },
        cream: {
          DEFAULT: '#faf9f7',
          dark:    '#f4efe8',
          darker:  '#ece5da',
        },
        charcoal: {
          DEFAULT: '#1e1a16',
          light:   '#3a3530',
          muted:   '#8a857e',
        },
        rose:  '#c4848c',
        sage:  '#7a8c72',
      },
      fontFamily: {
        display: ['Italiana', 'serif'],
        serif:   ['Playfair Display', 'serif'],
        sans:    ['Nunito Sans', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-in':  'slideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) both',
        'zoom-in':   'zoomIn 0.3s ease both',
        'float':     'float 6s ease-in-out infinite',
        'marquee':   'marquee 28s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        zoomIn:  { from: { opacity: '0', transform: 'scale(0.97)' },      to: { opacity: '1', transform: 'scale(1)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      boxShadow: {
        gold:      '0 4px 24px rgba(184, 145, 85, 0.25)',
        'gold-lg': '0 8px 40px rgba(184, 145, 85, 0.35)',
      },
      screens: { xs: '480px' },
    },
  },
  plugins: [],
};
