// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = {
  title: "Agencia de Viajes",
  description: "Reserva vuelos, hoteles y actividades",
  icons: { icon: "/meraki.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0d1117] text-white antialiased">
        {children}
      </body>
    </html>
  );
}