"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminDashboardResponse } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function AdminDashboardPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token || !canOperate) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await http<AdminDashboardResponse>("/api/admin/dashboard", {
        headers: buildAuthHeaders(token),
      });
      setDashboard(response);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para ver este panel.");
      } else {
        setError("No pudimos cargar el panel operativo.");
      }
    } finally {
      setLoading(false);
    }
  }, [canOperate, logout, token]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadDashboard();
  }, [hydrated, loadDashboard]);

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Panel operativo</h1>
          <p className="text-sm text-zinc-400">
            Vista rápida de clientes, reservas y señales financieras del sistema.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/app/admin/reservas" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
            Reservas
          </Link>
          <Link href="/app/admin/pagos" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
            Pagos
          </Link>
          {isAdmin ? (
            <>
              <Link href="/app/admin/catalogo" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
                Catálogo/media
              </Link>
              <Link href="/app/admin/clientes" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
                Clientes
              </Link>
              <Link href="/app/admin/incidencias" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
                Incidencias
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={!canOperate}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {!hydrated ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando sesión...</div> : null}
      {hydrated && !customer ? <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">Necesitas iniciar sesión.</div> : null}
      {hydrated && customer && !canOperate ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">Tu cuenta no tiene permisos para este panel.</div> : null}
      {hydrated && canOperate && loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando dashboard...</div> : null}

      {dashboard ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Clientes" value={dashboard.metrics.totalCustomers.toString()} detail="usuarios registrados" />
            <MetricCard label="Reservas" value={dashboard.metrics.totalBookings.toString()} detail={`${dashboard.metrics.confirmedBookings} confirmadas · ${dashboard.metrics.pendingBookings} pendientes`} />
            <MetricCard label="Cobrado" value={formatMoney(dashboard.metrics.grossRevenue)} detail={`${dashboard.metrics.succeededPayments} pagos exitosos`} />
            <MetricCard label="Reembolsado" value={formatMoney(dashboard.metrics.refundedAmount)} detail={`${dashboard.metrics.refundedPayments} pagos reembolsados`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Reservas recientes</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {dashboard.metrics.cancelledBookings} canceladas
                </span>
              </div>

              <div className="grid gap-3">
                {dashboard.recentBookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{booking.packageTitle}</div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{booking.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">
                      {booking.customerName} · {booking.customerEmail}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">
                      {booking.originCode} → {booking.destinationCode} · {formatMoney(booking.totalPrice)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {formatDate(booking.createdAt)}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Clientes recientes</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {dashboard.metrics.totalPayments} pagos registrados
                </span>
              </div>

              <div className="grid gap-3">
                {dashboard.recentCustomers.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.fullName}</div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{item.role}</span>
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">{item.email}</div>
                    <div className="mt-1 text-sm text-zinc-400">{item.phone || "Sin teléfono"}</div>
                    <div className="mt-1 text-xs text-zinc-500">{formatDate(item.createdAt)}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{detail}</div>
    </article>
  );
}
