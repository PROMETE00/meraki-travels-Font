"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type { PaymentHistoryItem } from "@/features/search/types";

const paymentStyles: Record<string, string> = {
  REQUIRES_ACTION: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  SUCCEEDED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  CANCELED: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  REFUNDED: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  FAILED: "border-red-400/30 bg-red-500/10 text-red-100",
};

const statusLabels: Record<string, string> = {
  REQUIRES_ACTION: "Acción requerida",
  SUCCEEDED: "Completado",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

const statusIcons: Record<string, React.ReactNode> = {
  REQUIRES_ACTION: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  SUCCEEDED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CANCELED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  REFUNDED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  FAILED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

export default function PagosPage() {
  const { customer, hydrated, token, logout } = useSessionStore();
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!customer || !token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payments = await http<PaymentHistoryItem[]>("/api/payments", {
        headers: buildAuthHeaders(token),
      });
      setItems(payments);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para consultar tus pagos.");
      } else {
        setError("No pudimos cargar el historial de pagos.");
      }
    } finally {
      setLoading(false);
    }
  }, [customer, logout, token]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadPayments();
  }, [hydrated, loadPayments]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  );

  // Calculate totals
  const totals = useMemo(() => {
    const paid = sortedItems.filter(p => p.status === "SUCCEEDED").reduce((sum, p) => sum + p.amount, 0);
    const refunded = sortedItems.filter(p => p.status === "REFUNDED").reduce((sum, p) => sum + p.amount, 0);
    const pending = sortedItems.filter(p => p.status === "REQUIRES_ACTION").reduce((sum, p) => sum + p.amount, 0);
    return { paid, refunded, pending };
  }, [sortedItems]);

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Pagos</h1>
          <p className="text-sm text-zinc-400">
            Historial completo de transacciones y reembolsos
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/app/bookings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver reservas
          </Link>
          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={!customer}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15 disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {hydrated && customer && !loading && sortedItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatMoney(totals.paid, "MXN")}</p>
                <p className="text-xs text-zinc-400">Total pagado</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
                <svg className="h-5 w-5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatMoney(totals.refunded, "MXN")}</p>
                <p className="text-xs text-zinc-400">Reembolsado</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatMoney(totals.pending, "MXN")}</p>
                <p className="text-xs text-zinc-400">Pendiente</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hydrated && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      )}

      {hydrated && !customer && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
              <svg className="h-7 w-7 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-100">Inicia sesión para ver tus pagos</h3>
              <p className="mt-1 text-sm text-amber-200/80">
                Accede a tu cuenta para ver tu historial de transacciones y reembolsos.
              </p>
            </div>
            <Link
              href="/app/login"
              className="rounded-xl bg-amber-500/20 px-5 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/30"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {hydrated && customer && loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p className="mt-3 text-sm text-zinc-400">Cargando historial de pagos...</p>
          </div>
        </div>
      )}

      {hydrated && customer && !loading && !sortedItems.length && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
            <svg className="h-8 w-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-white">Sin pagos registrados</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Los pagos de tus reservaciones aparecerán aquí
          </p>
          <Link
            href="/app/bookings"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
          >
            Ver mis reservas
          </Link>
        </div>
      )}

      {/* Payments list */}
      <div className="space-y-4">
        {sortedItems.map((payment) => (
          <article
            key={payment.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 transition-all duration-300 hover:border-white/20"
          >
            {/* Status banner */}
            <div className={`flex items-center gap-2 px-5 py-2 ${
              payment.status === "SUCCEEDED" ? "bg-emerald-500/10" :
              payment.status === "REFUNDED" ? "bg-sky-500/10" :
              payment.status === "REQUIRES_ACTION" ? "bg-amber-500/10" :
              "bg-zinc-800/50"
            }`}>
              <span className={`${
                payment.status === "SUCCEEDED" ? "text-emerald-300" :
                payment.status === "REFUNDED" ? "text-sky-300" :
                payment.status === "REQUIRES_ACTION" ? "text-amber-300" :
                "text-zinc-400"
              }`}>
                {statusIcons[payment.status]}
              </span>
              <span className={`text-sm font-medium ${
                payment.status === "SUCCEEDED" ? "text-emerald-200" :
                payment.status === "REFUNDED" ? "text-sky-200" :
                payment.status === "REQUIRES_ACTION" ? "text-amber-200" :
                "text-zinc-300"
              }`}>
                {statusLabels[payment.status] ?? payment.status}
              </span>
              <span className="ml-auto text-xs text-zinc-500">{formatDate(payment.createdAt)}</span>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{payment.packageTitle}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-300">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Reserva #{payment.bookingId}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span>{payment.originCode} → {payment.destinationCode}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Procesado por: {payment.provider}</span>
                    </div>
                    {payment.providerPaymentId && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="font-mono text-xs">{payment.providerPaymentId}</span>
                      </div>
                    )}
                    {payment.refundIds.length > 0 && (
                      <div className="flex items-center gap-2 text-sky-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Reembolsos: {payment.refundIds.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Monto</div>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {formatMoney(payment.amount, payment.currency)}
                    </div>
                  </div>

                  <Link
                    href={`/app/checkout/${payment.bookingId}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Security note */}
      {hydrated && customer && sortedItems.length > 0 && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Tus pagos están protegidos</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Todas las transacciones se procesan de forma segura a través de Stripe con encriptación SSL. 
                Tu información financiera nunca se almacena en nuestros servidores.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
