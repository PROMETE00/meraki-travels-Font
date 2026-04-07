"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import { generateBookingPDF } from "@/lib/pdf-generator";
import type { BookingResponse, CustomerPreferencesResponse } from "@/features/search/types";
import { 
  FaCalendarCheck, 
  FaClock, 
  FaCheck, 
  FaTimes,
  FaDownload,
  FaMoneyBillWave,
  FaPlane,
  FaMapMarkerAlt
} from "react-icons/fa";

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
  PENDING: <FaClock className="h-4 w-4" />,
  CONFIRMED: <FaCheck className="h-4 w-4" />,
  CANCELLED: <FaTimes className="h-4 w-4" />,
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-sm text-slate-600">Tu viaje ya comenzó</p>
        <p className="text-xs text-slate-500">¡Buen viaje! 🌟</p>
      </div>
    );
  }
  
  if (days === 0) {
    return (
      <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3 text-center">
        <p className="text-xl font-bold text-teal-700">¡Hoy es el día!</p>
        <p className="text-sm text-teal-600">Tu aventura comienza hoy ✈️</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
      <p className="text-3xl font-bold text-emerald-700">{days}</p>
      <p className="text-sm text-emerald-600">días para tu viaje</p>
    </div>
  );
}

export default function ReservasPage() {
  const { customer, hydrated, token, logout } = useSessionStore();
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerPrefs, setCustomerPrefs] = useState<CustomerPreferencesResponse | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!customer || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await http<BookingResponse[]>("/api/bookings", {
        headers: buildAuthHeaders(token),
      });
      setItems(response);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (isHttpErrorStatus(err, 401)) {
        logout();
        return;
      }
      setError("No se pudieron cargar tus reservas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [customer, token, logout]);

  const fetchCustomerPrefs = useCallback(async () => {
    if (!customer || !token) return;

    try {
      const response = await http<CustomerPreferencesResponse>("/api/customers/me/preferences", {
        headers: buildAuthHeaders(token),
      });
      setCustomerPrefs(response);
    } catch (err) {
      console.error("Error fetching customer preferences:", err);
    }
  }, [customer, token]);

  useEffect(() => {
    if (hydrated && customer) {
      fetchBookings();
      fetchCustomerPrefs();
    }
  }, [hydrated, customer, fetchBookings, fetchCustomerPrefs]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [items]);

  const handleDownloadPDF = useCallback(async (booking: BookingResponse) => {
    if (!customerPrefs) {
      alert("Cargando información del cliente...");
      return;
    }
    
    try {
      await generateBookingPDF(booking, customer!, customerPrefs);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Inténtalo de nuevo.");
    }
  }, [customer, customerPrefs]);

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis reservas</h1>
          <p className="text-slate-600">
            Gestiona tus viajes, descarga documentos y realiza pagos pendientes.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FaPlane className="h-4 w-4" />
            Buscar nuevos viajes
          </Link>
          <Link
            href="/app/payments"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FaMoneyBillWave className="h-4 w-4" />
            Ver pagos
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {hydrated && customer && sortedItems.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FaCalendarCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{sortedItems.length}</p>
                <p className="text-sm text-slate-600">Total de reservas</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <FaCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{sortedItems.filter(b => b.status === "CONFIRMED").length}</p>
                <p className="text-sm text-slate-600">Viajes confirmados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <FaClock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{sortedItems.filter(b => b.status === "PENDING").length}</p>
                <p className="text-sm text-slate-600">Pendientes de pago</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-100 p-2">
                <FaMoneyBillWave className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatMoney(sortedItems.filter(b => b.status === "CONFIRMED").reduce((sum, b) => sum + b.totalPrice, 0))}
                </p>
                <p className="text-sm text-slate-600">Total invertido</p>
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
            <p className="mt-3 text-sm text-slate-600">Cargando tus viajes...</p>
          </div>
        </div>
      ) : null}

      {/* Not Logged In State */}
      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <FaPlane className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-amber-800">Inicia sesión para ver tus viajes</h3>
          <p className="mt-2 text-amber-700">
            Accede a tu cuenta para ver tus reservaciones, descargar documentos y más.
          </p>
          <Link
            href="/app/login"
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
      {hydrated && customer && !loading && !sortedItems.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
            <FaMapMarkerAlt className="h-10 w-10 text-teal-600" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-slate-800">¡Tu próxima aventura te espera!</h3>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            Aún no tienes viajes reservados. Explora nuestros increíbles destinos y comienza a planear tu próxima experiencia.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
            >
              <FaPlane className="h-5 w-5" />
              Explorar destinos
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver paquetes
            </Link>
          </div>
        </div>
      ) : null}

      {/* Reservations List */}
      {hydrated && customer && !loading && sortedItems.length > 0 ? (
        <div className="space-y-6">
          {sortedItems.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[booking.status] ?? statusStyles.PENDING}`}>
                      {statusIcons[booking.status]}
                      {statusLabels[booking.status] ?? booking.status}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">Reserva #{booking.id}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  {/* Main info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{booking.packageTitle}</h2>
                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">
                          <FaMapMarkerAlt className="h-4 w-4" />
                          {booking.originCode}
                        </div>
                        <div className="text-teal-600">→</div>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-teal-100 px-3 py-1.5 text-teal-700">
                          <FaMapMarkerAlt className="h-4 w-4" />
                          {booking.destinationCode}
                        </div>
                      </div>
                    </div>

                    {/* Travel dates */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FaPlane className="h-4 w-4" />
                          Salida
                        </div>
                        <div className="mt-1 font-semibold text-slate-800">{formatDateFull(booking.startDate)}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FaPlane className="h-4 w-4 rotate-180" />
                          Regreso
                        </div>
                        <div className="mt-1 font-semibold text-slate-800">{formatDateFull(booking.endDate)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - countdown and total */}
                  <div className="flex flex-col gap-4 lg:w-72">
                    <TripCountdown startDate={booking.startDate} status={booking.status} />
                    
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="text-xs font-medium uppercase tracking-widest text-slate-600">Total pagado</div>
                      <div className="mt-1 text-2xl font-bold text-slate-800">{formatMoney(booking.totalPrice)}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                  <button
                    onClick={() => handleDownloadPDF(booking)}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <FaDownload className="h-4 w-4" />
                    Descargar PDF
                  </button>
                  
                  {booking.status === "PENDING" && (
                    <Link
                      href={`/app/checkout/${booking.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      <FaMoneyBillWave className="h-4 w-4" />
                      Completar pago
                    </Link>
                  )}
                  
                  <Link
                    href={`/app/bookings/${booking.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}