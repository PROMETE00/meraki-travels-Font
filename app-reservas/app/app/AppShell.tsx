"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/session-store";
import { useState } from "react";
import {
  FaBars,
  FaBell,
  FaCalendarCheck,
  FaChartPie,
  FaCreditCard,
  FaFileAlt,
  FaHeadset,
  FaHome,
  FaSignOutAlt,
  FaTimes,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const customerMenu: MenuItem[] = [
  { href: "/app", label: "Inicio", icon: FaHome },
  { href: "/app/reservas", label: "Reservas", icon: FaCalendarCheck },
  { href: "/app/pagos", label: "Pagos", icon: FaCreditCard },
  { href: "/app/incidencias", label: "Incidencias", icon: FaBell },
  { href: "/app/documentos", label: "Documentos", icon: FaFileAlt },
  { href: "/app/soporte", label: "Soporte", icon: FaHeadset },
];

const operationsMenu: MenuItem[] = [
  { href: "/app/admin", label: "Panel operativo", icon: FaChartPie },
  { href: "/app/admin/reservas", label: "Reservas", icon: FaCalendarCheck },
  { href: "/app/admin/pagos", label: "Pagos", icon: FaCreditCard },
  { href: "/app/admin/catalogo", label: "Catálogo", icon: FaFileAlt },
  { href: "/app/admin/dome", label: "Dome", icon: FaChartPie },
  { href: "/app/admin/documentos", label: "Documentos", icon: FaFileAlt },
];

const adminOnlyMenu: MenuItem[] = [
  { href: "/app/admin/clientes", label: "Clientes", icon: FaUsers },
  { href: "/app/admin/incidencias", label: "Incidencias", icon: FaBell },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { customer, logout, hydrated } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function linkClass(href: string) {
    const active = href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition text-sm font-medium ${
      active
        ? "bg-white text-slate-900 shadow-sm"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  }

  function handleLogout() {
    setMobileMenuOpen(false);
    logout();
    router.push("/");
  }

  const menuItems = canOperate
    ? [...operationsMenu, ...(isAdmin ? adminOnlyMenu : [])]
    : [...customerMenu, { href: "/app/perfil", label: "Mi perfil", icon: FaUserShield }];

  const roleBadge = customer?.role === "ADMIN" ? "Admin" : customer?.role === "OPERATIONS" ? "Operador" : "Cliente";
  const sidebarTheme =
    customer?.role === "ADMIN"
      ? "from-slate-900 via-slate-800 to-teal-700"
      : customer?.role === "OPERATIONS"
        ? "from-slate-900 via-slate-800 to-teal-700"
        : "from-slate-900 via-slate-800 to-teal-700";

  if (pathname === "/app/acceder") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">{children}</div>;
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-2 sm:p-4 md:p-6">
        <div className="grid min-h-[calc(100vh-1rem)] w-full gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-3 shadow-2xl sm:min-h-[calc(100vh-2rem)] sm:p-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-5 md:rounded-[2rem] md:p-5">
          <div className="rounded-3xl bg-white/10" />
          <div className="rounded-3xl bg-white/10 p-4">
            <div className="mb-4 h-14 rounded-2xl bg-white/20" />
            <div className="h-[60vh] rounded-2xl bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-teal-50 p-2 sm:p-4 md:p-6">
      <div className="grid min-h-[calc(100vh-1rem)] w-full gap-4 rounded-[1.5rem] border border-slate-200 bg-white/85 p-2 shadow-xl sm:min-h-[calc(100vh-2rem)] sm:p-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-5 md:rounded-[2rem] md:p-5">
        <aside className={`hidden rounded-3xl bg-gradient-to-b ${sidebarTheme} p-4 text-white shadow-xl md:block`}>
          <div className="mb-6 px-2">
            <div className="text-lg font-bold">Meraki Reservas</div>
            <p className="text-xs text-white/80">Panel de cuenta</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500/25"
          >
            <FaSignOutAlt className="h-4 w-4" />
            Salir
          </button>
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
            />
            <div className={`absolute left-0 top-0 h-full w-[82vw] max-w-[20rem] bg-gradient-to-b ${sidebarTheme} p-4 text-white shadow-2xl`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Meraki Reservas</div>
                  <p className="text-xs text-white/80">Panel de cuenta</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-white/20 bg-white/10 p-2"
                  aria-label="Cerrar menú"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-2">
                {menuItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={`mobile-${href}`}
                    href={href}
                    className={linkClass(href)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500/25"
              >
                <FaSignOutAlt className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        ) : null}

        <section className="min-w-0 overflow-x-hidden rounded-2xl bg-white p-3 shadow-lg sm:rounded-3xl sm:p-5 md:p-6">
          <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700"
                  aria-label="Abrir menú"
                >
                  <FaBars className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#949AB1]">Dashboard</span>
              </div>
                <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:block">Dashboard</p>
                <h1 className="text-xl font-bold text-slate-900">Bienvenido, {customer?.fullName || "Usuario"}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 lg:flex">
                  <span>Buscar</span>
                  <input
                    type="text"
                    placeholder="Buscar en tu panel"
                    className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                <div className="flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-teal-600 text-xs font-semibold text-white">
                    {customer?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{customer?.fullName || "Sin sesión"}</div>
                    <div className="text-xs text-teal-700">{roleBadge}</div>
                  </div>
                </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </div>
  );
}
