// app/layout.tsx (Server)
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Agencia - Demo',
  description: 'Reserva vuelos, hoteles y tours',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}