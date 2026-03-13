// app/app/layout.tsx
import type { Metadata } from "next";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "Módulo App",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
