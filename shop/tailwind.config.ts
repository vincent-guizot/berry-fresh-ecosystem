import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
