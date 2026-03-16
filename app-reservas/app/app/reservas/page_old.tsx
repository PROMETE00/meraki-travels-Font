"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import { generateBookingPDF } from "@/lib/pdf-generator";
import type { BookingResponse, CustomerPreferencesResponse } from "@/features/search/types";

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700", 
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente de pago",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CONFIRMED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CANCELLED: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(date));
}

function formatDateFull(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  }).format(new Date(date));
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function TripCountdown({ startDate, status }: { startDate: string | null; status: string }) {
  const days = daysUntil(startDate);
  
  if (status === "CANCELLED" || days === null) return null;
  
  if (days < 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-center">
        <p className="text-sm text-zinc-400">Tu viaje ya comenzó</p>
        <p className="text-xs text-zinc-500">¡Buen viaje! 🌟</p>
      </div>
    );
  }
  
  if (days === 0) {
    return (
      <div className="rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-purple-500/20 px-4 py-3 text-center">
        <p className="text-xl font-bold text-violet-300">¡Hoy es el día!</p>
        <p className="text-sm text-violet-200">Tu aventura comienza hoy ✈️</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center">
      <p className="text-3xl font-bold text-emerald-300">{days}</p>
      <p className="text-sm text-emerald-200">días para tu viaje</p>
    </div>
  );
}

export default function ReservasPage() {
  const { customer, hydrated, token, logout } = useSessionStore();
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [preferences, setPreferences] = useState<CustomerPreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!customer || !token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [bookings, prefs] = await Promise.all([
        http<BookingResponse[]>("/api/bookings", {
          headers: buildAuthHeaders(token),
        }),
        http<CustomerPreferencesResponse>("/api/customers/me/preferences", {
          headers: buildAuthHeaders(token),
        }).catch(() => null),
      ]);
      setItems(bookings);
      setPreferences(prefs);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para consultar tus reservas.");
      } else {
        setError("No pudimos cargar las reservas. Verifica que el backend esté disponible.");
      }
    } finally {
      setLoading(false);
    }
  }, [customer, logout, token]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadBookings();
  }, [hydrated, loadBookings]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  );

  async function cancelBooking(bookingId: number) {
    if (!token) {
      return;
    }

    try {
      setActingId(bookingId);
      setError(null);
      const updated = await http<BookingResponse>(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });

      setItems((current) => current.map((item) => (item.id === bookingId ? updated : item)));
    } catch (cancelError) {
      console.error(cancelError);
      if (isHttpErrorStatus(cancelError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para cancelar la reserva.");
      } else {
        setError("No pudimos cancelar la reserva. Intenta nuevamente en unos segundos.");
      }
    } finally {
      setActingId(null);
    }
  }

  async function refundBooking(bookingId: number) {
    if (!token) {
      return;
    }

    try {
      setActingId(bookingId);
      setError(null);
      const updated = await http<BookingResponse>(`/api/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });

      setItems((current) => current.map((item) => (item.id === bookingId ? updated : item)));
    } catch (refundError) {
      console.error(refundError);
      if (isHttpErrorStatus(refundError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para reembolsar la reserva.");
      } else {
        setError("No pudimos procesar el reembolso. Revisa el estado del pago e intenta de nuevo.");
      }
    } finally {
      setActingId(null);
    }
  }

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Viajes</h1>
          <p className="text-sm text-zinc-400">
            Seguimiento completo de tus reservaciones y próximas aventuras
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar más
          </Link>
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={!customer}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Quick stats for customer */}
      {hydrated && customer && !loading && sortedItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <svg className="h-5 w-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{sortedItems.filter(b => b.status === "CONFIRMED").length}</p>
                <p className="text-xs text-zinc-400">Viajes confirmados</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{sortedItems.filter(b => b.status === "PENDING").length}</p>
                <p className="text-xs text-zinc-400">Pendientes de pago</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatMoney(sortedItems.filter(b => b.status === "CONFIRMED").reduce((sum, b) => sum + b.totalPrice, 0))}
                </p>
                <p className="text-xs text-zinc-400">Total invertido</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hydrated ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : null}

      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
              <svg className="h-7 w-7 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-100">Inicia sesión para ver tus viajes</h3>
              <p className="mt-1 text-sm text-amber-200/80">
                Accede a tu cuenta para ver tus reservaciones, descargar documentos y más.
              </p>
            </div>
            <Link
              href="/app/acceder"
              className="rounded-xl bg-amber-500/20 px-5 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-500/30"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {hydrated && customer && loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <p className="mt-3 text-sm text-zinc-400">Cargando tus viajes...</p>
          </div>
        </div>
      ) : null}

      {hydrated && customer && !loading && !sortedItems.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
            <svg className="h-8 w-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-white">Aún no tienes viajes</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Explora nuestros destinos y comienza a planear tu próxima aventura
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorar destinos
          </Link>
        </div>
      ) : null}

      {/* Reservations list */}
      <div className="space-y-4">
        {sortedItems.map((booking) => (
          <article
            key={booking.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-violet-500/5"
          >
            {/* Status banner */}
            <div className={`flex items-center gap-2 px-5 py-2 ${
              booking.status === "CONFIRMED" ? "bg-emerald-500/10" :
              booking.status === "PENDING" ? "bg-amber-500/10" :
              "bg-zinc-800/50"
            }`}>
              <span className={`${
                booking.status === "CONFIRMED" ? "text-emerald-300" :
                booking.status === "PENDING" ? "text-amber-300" :
                "text-zinc-400"
              }`}>
                {statusIcons[booking.status]}
              </span>
              <span className={`text-sm font-medium ${
                booking.status === "CONFIRMED" ? "text-emerald-200" :
                booking.status === "PENDING" ? "text-amber-200" :
                "text-zinc-300"
              }`}>
                {statusLabels[booking.status] ?? booking.status}
              </span>
              <span className="ml-auto text-xs text-zinc-500">ID: #{booking.id}</span>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Main info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{booking.packageTitle}</h2>
                    <div className="mt-2 flex items-center gap-3 text-sm text-zinc-300">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {booking.originCode}
                      </span>
                      <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 px-2.5 py-1 text-violet-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {booking.destinationCode}
                      </span>
                    </div>
                  </div>

                  {/* Travel dates */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Salida
                      </div>
                      <div className="mt-1 font-medium text-white">{formatDateFull(booking.startDate)}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Regreso
                      </div>
                      <div className="mt-1 font-medium text-white">{formatDateFull(booking.endDate)}</div>
                    </div>
                  </div>
                </div>

                {/* Right side - countdown and total */}
                <div className="flex flex-col gap-4 lg:w-64">
                  <TripCountdown startDate={booking.startDate} status={booking.status} />
                  
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Total</div>
                    <div className="mt-1 text-2xl font-bold text-white">{formatMoney(booking.totalPrice)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
                <Link
                  href={`/app/checkout/${booking.id}`}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    booking.status === "PENDING"
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {booking.status === "PENDING" ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Continuar pago
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver detalles
                    </>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => customer && generateBookingPDF(booking, customer, preferences)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar PDF
                </button>
                {booking.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => void cancelBooking(booking.id)}
                    disabled={actingId === booking.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {actingId === booking.id ? "Cancelando..." : "Cancelar"}
                  </button>
                )}
                {booking.status === "CONFIRMED" && (
                  <button
                    type="button"
                    onClick={() => void refundBooking(booking.id)}
                    disabled={actingId === booking.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    {actingId === booking.id ? "Procesando..." : "Solicitar reembolso"}
                  </button>
                )}

                <span className="ml-auto text-xs text-zinc-500">
                  Reservado el {formatDate(booking.createdAt)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Contact support section */}
      {hydrated && customer && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
              <svg className="h-7 w-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">¿Necesitas ayuda con tu viaje?</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Nuestro equipo está listo para asistirte con cualquier consulta sobre tus reservaciones.
              </p>
            </div>
            <Link
              href="/app/soporte"
              className="rounded-xl bg-violet-500/20 px-5 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-violet-500/30"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
