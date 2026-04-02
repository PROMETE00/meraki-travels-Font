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

export default function AdminPagosPage() {
  const { customer, hydrated, token, logout } = useSessionStore();
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const loadPayments = useCallback(async () => {
    if (!customer || !token || !canOperate) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payments = await http<PaymentHistoryItem[]>("/api/admin/payments", {
        headers: buildAuthHeaders(token),
      });
      setItems(payments);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para ver pagos operativos.");
      } else {
        setError("No pudimos cargar el panel de pagos.");
      }
    } finally {
      setLoading(false);
    }
  }, [customer, canOperate, logout, token]);

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

  return (
    <main className="app-page p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="app-title">Panel admin de pagos</h1>
          <p className="app-subtitle">
            Vista operativa global de pagos y reembolsos disponible para cuentas ADMIN u OPERATIONS.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={!canOperate}
            className="app-primary-button"
          >
            Actualizar
          </button>
        </div>
      </div>

      {!hydrated ? (
        <div className="app-surface-soft p-6 text-sm text-slate-600">
          Cargando sesión...
        </div>
      ) : null}

      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Necesitas iniciar sesión desde <Link href="/app/perfil" className="underline">perfil</Link>.
        </div>
      ) : null}

      {hydrated && customer && !canOperate ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Tu cuenta actual no tiene permisos para ver el panel global.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {hydrated && canOperate && loading ? (
        <div className="app-surface-soft p-6 text-sm text-slate-600">
          Cargando pagos globales...
        </div>
      ) : null}

      {hydrated && canOperate && !loading && !sortedItems.length ? (
        <div className="app-surface-soft p-6 text-sm text-slate-600">
          Aún no hay pagos registrados en el sistema.
        </div>
      ) : null}

      <div className="grid gap-4">
        {sortedItems.map((payment) => (
          <article
            key={payment.id}
            className="app-surface p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{payment.packageTitle}</h2>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      paymentStyles[payment.status] ?? "border-white/15 bg-white/10 text-white"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>

                <div className="text-sm text-zinc-300">
                  Cliente: {payment.customerName} · {payment.customerEmail}
                </div>

                <div className="text-sm text-zinc-300">
                  Reserva #{payment.bookingId} · {payment.originCode} → {payment.destinationCode}
                </div>

                <div className="grid gap-1 text-sm text-zinc-400">
                  <div>Provider: {payment.provider}</div>
                  <div>Estado reserva: {payment.bookingStatus}</div>
                  <div>PaymentIntent: {payment.providerPaymentId ?? "Sin ID externo"}</div>
                  <div>Creado: {formatDate(payment.createdAt)}</div>
                  {payment.refundIds.length ? <div>Refunds: {payment.refundIds.join(", ")}</div> : null}
                </div>
              </div>

              <div className="space-y-3 text-left md:text-right">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Monto</div>
                  <div className="text-xl font-bold">{formatMoney(payment.amount, payment.currency)}</div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/app/checkout/${payment.bookingId}`}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                  >
                    Ver checkout
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
