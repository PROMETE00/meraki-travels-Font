// app/layout.tsx
import "./globals.css";
import React from "react";
import BackgroundDots from "@/components/ui/BackgroundDots";

export const metadata = { title: "Agencia de Viajes", description: "Reserva vuelos, hoteles y actividades" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* fondo global #0d1117 */}
      <body className="min-h-screen bg-[#0d1117] text-white">
        <BackgroundDots /> {/* si lo usas */}
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}