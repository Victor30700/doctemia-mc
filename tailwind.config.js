//tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      transitionProperty: {
        'width': 'width',
      }
    },
  },
  plugins: [],
  // Agregar safelist para clases que podrían no ser detectadas
  safelist: [
    'dark',
    'bg-white',
    'bg-gray-800',
    'bg-gray-900',
    'text-white',
    'text-gray-900',
    'text-gray-200',
    'text-gray-700',
    'border-gray-200',
    'border-gray-700',
    'hover:bg-gray-100',
    'hover:bg-gray-700',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:text-white',
    'dark:text-gray-200',
    'dark:border-gray-700',
    'dark:hover:bg-gray-700'
  ]
};
