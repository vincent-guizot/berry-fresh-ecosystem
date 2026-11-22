/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        berry: {
          red: '#A83F52',
          pink: '#D98291',
          blush: '#F2B8C0',
          pastel: '#FBE5E7',
          cream: '#FFF8F5',
          green: '#879B79',
          beige: '#E8CDAF',
          charcoal: '#34343A',
        }
      }
    },
  },
  plugins: [],
}
