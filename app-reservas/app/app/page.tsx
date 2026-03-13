"use client";

import Link from "next/link";
import { useSessionStore } from "@/lib/session-store";

export default function AppHomePage() {
  const customer = useSessionStore((state) => state.customer);
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";

  return (
    <main className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">App · Inicio</h1>
        <p className="text-sm text-zinc-400">
          Desde aquí puedes revisar reservas demo creadas desde la búsqueda y continuar al checkout.
        </p>
      </div>

      <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-2 xl:grid-cols-7" : isOperations ? "md:grid-cols-2 xl:grid-cols-6" : "md:grid-cols-4"}`}>
        <Link
          href="/app/reservas"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
          <div className="text-lg font-semibold">Ver reservas</div>
          <p className="mt-2 text-sm text-zinc-400">
            Revisa el historial actual, estados y accesos rápidos al checkout.
          </p>
        </Link>

        <Link
          href="/"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
          <div className="text-lg font-semibold">Buscar más paquetes</div>
          <p className="mt-2 text-sm text-zinc-400">
            Regresa al buscador principal para crear nuevas reservas demo.
          </p>
        </Link>

        <Link
          href="/app/pagos"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
          <div className="text-lg font-semibold">Ver pagos</div>
          <p className="mt-2 text-sm text-zinc-400">
            Consulta cobros, reembolsos y el estado financiero asociado a tus reservas.
          </p>
        </Link>

        <Link
          href="/app/incidencias"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
          <div className="text-lg font-semibold">Ver incidencias</div>
          <p className="mt-2 text-sm text-zinc-400">
            Sigue tickets abiertos por soporte y responde a operaciones desde tu cuenta.
          </p>
        </Link>

        {isAdmin ? (
          <>
            <Link
              href="/app/admin"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Panel operativo</div>
              <p className="mt-2 text-sm text-zinc-400">
                Revisa métricas, reservas recientes y clientes registrados desde la vista admin.
              </p>
            </Link>
            <Link
              href="/app/admin/clientes"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Gestionar clientes</div>
              <p className="mt-2 text-sm text-zinc-400">
                Busca usuarios, revisa su historial operativo y ajusta roles desde el panel admin.
              </p>
            </Link>
            <Link
              href="/app/admin/incidencias"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Gestionar incidencias</div>
              <p className="mt-2 text-sm text-zinc-400">
                Registra tickets operativos ligados a clientes y reservas para dar seguimiento a soporte.
              </p>
            </Link>
            <Link
              href="/app/admin/catalogo"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Gestionar media</div>
              <p className="mt-2 text-sm text-zinc-400">
                Sube portadas de paquetes y banners desde la galería interna del panel administrativo.
              </p>
            </Link>
          </>
        ) : isOperations ? (
          <>
            <Link
              href="/app/admin"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Operaciones</div>
              <p className="mt-2 text-sm text-zinc-400">
                Acceso rápido a reservas y pagos operativos.
              </p>
            </Link>
            <Link
              href="/app/admin/reservas"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Operaciones · Reservas</div>
              <p className="mt-2 text-sm text-zinc-400">
                Confirma, cancela y reembolsa reservas.
              </p>
            </Link>
            <Link
              href="/app/admin/pagos"
              className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 transition hover:bg-cyan-500/10"
            >
              <div className="text-lg font-semibold">Operaciones · Pagos</div>
              <p className="mt-2 text-sm text-zinc-400">
                Consulta pagos y estados de cobro.
              </p>
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
