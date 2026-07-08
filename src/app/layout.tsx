import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { ThemeScript } from '@/components/theme/theme-script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const displaySerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Creatiba · Plataforma Creativa IA',
  description: 'Generacion de contenido creativo multi-tenant para las agencias del Grupo Zapata.',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${displaySerif.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
