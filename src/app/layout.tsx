import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plataforma Creativa IA · Grupo Zapata',
  description: 'Generacion de contenido creativo multi-tenant para las agencias del Grupo Zapata.',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
