"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type { PaymentHistoryItem } from "@/features/search/types";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUndo,
  FaBan,
  FaCreditCard,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaChartLine
} from "react-icons/fa";

const paymentStyles: Record<string, string> = {
  REQUIRES_ACTION: "border-amber-200 bg-amber-50 text-amber-700",
  SUCCEEDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELED: "border-slate-200 bg-slate-50 text-slate-700",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  REQUIRES_ACTION: "Acción requerida",
  SUCCEEDED: "Completado",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

const statusIcons: Record<string, React.ReactNode> = {
  REQUIRES_ACTION: <FaExclamationTriangle className="h-4 w-4" />,
  SUCCEEDED: <FaCheckCircle className="h-4 w-4" />,
  CANCELED: <FaBan className="h-4 w-4" />,
  REFUNDED: <FaUndo className="h-4 w-4" />,
  FAILED: <FaTimesCircle className="h-4 w-4" />,
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
      const response = await http<PaymentHistoryItem[]>("/api/payments", {
        headers: buildAuthHeaders(token),
      });
      setItems(response);
    } catch (err) {
      console.error("Error loading payments:", err);
      if (isHttpErrorStatus(err, 401)) {
        logout();
        return;
      }
      setError("Error al cargar tus pagos. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [customer, token, logout]);

  useEffect(() => {
    if (hydrated) {
      loadPayments();
    }
  }, [hydrated, loadPayments]);

  const sortedPayments = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items]);

  const stats = useMemo(() => {
    const totalPaid = items
      .filter(p => p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalRefunded = items
      .filter(p => p.status === "REFUNDED")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingActions = items.filter(p => p.status === "REQUIRES_ACTION").length;
    
    return { totalPaid, totalRefunded, pendingActions };
  }, [items]);

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Historial de pagos</h1>
          <p className="text-slate-600">
            Revisa tus transacciones, comprobantes y estados de pago.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/reservas"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FaFileInvoiceDollar className="h-4 w-4" />
            Ver mis reservas
          </Link>
          <Link
            href="/app/soporte"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FaMoneyBillWave className="h-4 w-4" />
            Ayuda con pagos
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {hydrated && customer && items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <FaCheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalPaid, "MXN")}</p>
                <p className="text-sm text-slate-600">Total pagado</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FaUndo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalRefunded, "MXN")}</p>
                <p className="text-sm text-slate-600">Reembolsos</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <FaExclamationTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.pendingActions}</p>
                <p className="text-sm text-slate-600">Acciones pendientes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-100 p-2">
                <FaChartLine className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{items.length}</p>
                <p className="text-sm text-slate-600">Total transacciones</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!hydrated || (hydrated && customer && loading) ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-600">Cargando historial de pagos...</p>
          </div>
        </div>
      ) : null}

      {/* Not Logged In State */}
      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <FaCreditCard className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-amber-800">Inicia sesión para ver tus pagos</h3>
          <p className="mt-2 text-amber-700">
            Accede a tu cuenta para revisar el historial de transacciones y comprobantes.
          </p>
          <Link
            href="/app/acceder"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700"
          >
            Iniciar sesión
          </Link>
        </div>
      ) : null}

      {/* Error State */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {/* Empty State */}
      {hydrated && customer && !loading && !items.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <FaMoneyBillWave className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-slate-800">Aún no tienes transacciones</h3>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            Cuando realices tu primera reserva, aquí aparecerá el historial de todos tus pagos y transacciones.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/app/reservas"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
            >
              <FaFileInvoiceDollar className="h-5 w-5" />
              Ver mis reservas
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Explorar destinos
            </Link>
          </div>
        </div>
      ) : null}

      {/* Payments List */}
      {hydrated && customer && !loading && items.length > 0 ? (
        <div className="space-y-6">
          {sortedPayments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                      paymentStyles[payment.status] ?? paymentStyles.FAILED
                    }`}>
                      {statusIcons[payment.status]}
                      {statusLabels[payment.status] ?? payment.status}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">ID: {payment.id}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  {/* Main info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {payment.packageTitle || "Pago de reserva"}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <FaCalendarAlt className="h-4 w-4" />
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>

                    <div className="mt-3">{/* Removed description field */}</div>

                    {/* Payment Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                          Método de pago
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {payment.paymentMethod || "Tarjeta de crédito"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                          Referencia
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          #{payment.id}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:w-48">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                        Monto
                      </div>
                      <div className="mt-1 text-2xl font-bold text-slate-800">
                        {formatMoney(payment.amount || 0, payment.currency || "MXN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {payment.status === "REQUIRES_ACTION" && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-800">Acción requerida</h4>
                          <p className="mt-1 text-sm text-amber-700">
                            Se requiere completar la verificación de este pago.
                          </p>
                          <div className="mt-3">
                            <Link
                              href={`/app/checkout/${payment.bookingId}`}
                              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                            >
                              Completar pago
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}