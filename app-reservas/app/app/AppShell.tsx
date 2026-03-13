"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/session-store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { customer, logout, hydrated } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const pathname = usePathname();
  const router = useRouter();

  function linkClass(href: string, admin = false) {
    const active = href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    if (admin) {
      return `rounded-xl border px-3 py-2 transition ${
        active
          ? "border-violet-300/60 bg-violet-500/20 text-white"
          : "border-violet-400/30 hover:bg-violet-500/10"
      }`;
    }
    return `rounded-xl border px-3 py-2 transition ${
      active
        ? "border-white/30 bg-white/15 text-white"
        : "border-white/10 hover:bg-white/10"
    }`;
  }

  function handleLogout() {
    logout();
    router.push("/app/acceder");
  }

  // Show minimal nav for login page
  if (pathname === "/app/acceder") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950">
        {children}
      </div>
    );
  }

  // Loading state
  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <span className="text-sm text-zinc-400">Cargando...</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {customer ? (
            <>
              <Link href="/app" className={linkClass("/app")}>
                Inicio
              </Link>
              <Link href="/app/reservas" className={linkClass("/app/reservas")}>
                Reservas
              </Link>
              <Link href="/app/pagos" className={linkClass("/app/pagos")}>
                Pagos
              </Link>
              <Link href="/app/incidencias" className={linkClass("/app/incidencias")}>
                Incidencias
              </Link>
              {isAdmin ? (
                <>
                  <Link href="/app/admin" className={linkClass("/app/admin", true)}>
                    Admin dashboard
                  </Link>
                  <Link href="/app/admin/reservas" className={linkClass("/app/admin/reservas", true)}>
                    Admin reservas
                  </Link>
                  <Link href="/app/admin/pagos" className={linkClass("/app/admin/pagos", true)}>
                    Admin pagos
                  </Link>
                  <Link href="/app/admin/catalogo" className={linkClass("/app/admin/catalogo", true)}>
                    Admin catálogo
                  </Link>
                  <Link href="/app/admin/dome" className={linkClass("/app/admin/dome", true)}>
                    Dome Gallery
                  </Link>
                  <Link href="/app/admin/clientes" className={linkClass("/app/admin/clientes", true)}>
                    Admin clientes
                  </Link>
                  <Link href="/app/admin/incidencias" className={linkClass("/app/admin/incidencias", true)}>
                    Admin incidencias
                  </Link>
                </>
              ) : isOperations ? (
                <>
                  <Link href="/app/admin" className={linkClass("/app/admin", true)}>
                    Operaciones
                  </Link>
                  <Link href="/app/admin/reservas" className={linkClass("/app/admin/reservas", true)}>
                    Op. reservas
                  </Link>
                  <Link href="/app/admin/pagos" className={linkClass("/app/admin/pagos", true)}>
                    Op. pagos
                  </Link>
                  <Link href="/app/admin/catalogo" className={linkClass("/app/admin/catalogo", true)}>
                    Op. catálogo
                  </Link>
                  <Link href="/app/admin/dome" className={linkClass("/app/admin/dome", true)}>
                    Dome Gallery
                  </Link>
                </>
              ) : null}
              <Link href="/app/soporte" className={linkClass("/app/soporte")}>
                Soporte
              </Link>
              <Link href="/app/perfil" className={linkClass("/app/perfil")}>
                Mi perfil
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={linkClass("/")}>
                Explorar
              </Link>
              <Link href="/app/acceder" className={linkClass("/app/acceder")}>
                Acceder
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {customer ? (
            <>
              <div className="flex items-center gap-2 text-zinc-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white">
                  {customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium text-white">{customer.fullName}</span>
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                    {customer.role === "ADMIN" ? "Admin" : customer.role === "OPERATIONS" ? "Operador" : "Cliente"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
              >
                Salir
              </button>
            </>
          ) : (
            <span className="text-zinc-500">Sin sesión</span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
