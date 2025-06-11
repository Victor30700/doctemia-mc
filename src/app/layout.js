// src/app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';


export const metadata = {
  title: 'Doctemia MC',
  description: 'Panel administrativo',
  icons: {
    icon: [
      { url: '/iconDoc.svg', type: 'image/svg+xml' }, // Ruta a tu SVG en la carpeta public
    ],
    // Puedes añadir otros iconos aquí si los tienes, por ejemplo:
    // apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
        <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
