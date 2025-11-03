// app/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Módulo App",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6">
      {children}
    </div>
  );
}
