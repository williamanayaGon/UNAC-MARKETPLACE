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
          50: '#E6F1FB',
          100: '#B5D4F4',
          200: '#85B7EB',
          400: '#378ADD',
          600: '#185FA5',
          800: '#0C447C',
          900: '#042C53',
        },
        gray: {
          50: '#F1EFE8',
          100: '#D3D1C7',
          200: '#B4B2A9',
          400: '#888780',
          600: '#5F5E5A',
          800: '#444441',
          900: '#2C2C2A',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}