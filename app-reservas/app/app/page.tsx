"use client";

import Link from "next/link";
import { useSessionStore } from "@/lib/session-store";
import { useCallback, useEffect, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders } from "@/lib/session-store";
import type { BookingResponse } from "@/features/search/types";
import { 
  FaCalendarCheck, 
  FaSearch, 
  FaCreditCard, 
  FaHeadset, 
  FaUserCog,
  FaUsers,
  FaChartLine,
  FaImages,
  FaPlane,
  FaMapMarkerAlt,
  FaDownload,
  FaFileAlt,
  FaPassport,
  FaIdCard,
  FaClock,
  FaRoute,
  FaHotel,
  FaTicketAlt
} from "react-icons/fa";

interface TravelDocument {
  id: string;
  name: string;
  type: "passport" | "visa" | "insurance" | "ticket" | "voucher" | "itinerary";
  url: string;
  bookingId?: number;
}

// Documentos de ejemplo - en producción vendrían de la API
const mockDocuments: TravelDocument[] = [
  { id: "1", name: "Guía de documentos de viaje", type: "passport", url: "#" },
  { id: "2", name: "Formulario de seguro de viaje", type: "insurance", url: "#" },
  { id: "3", name: "Check-in online - Guía", type: "ticket", url: "#" },
  { id: "4", name: "Información de visas", type: "visa", url: "#" },
];

const documentTypeIcons: Record<string, React.ReactNode> = {
  passport: <FaPassport className="h-5 w-5" />,
  visa: <FaIdCard className="h-5 w-5" />,
  insurance: <FaFileAlt className="h-5 w-5" />,
  ticket: <FaTicketAlt className="h-5 w-5" />,
  voucher: <FaFileAlt className="h-5 w-5" />,
  itinerary: <FaRoute className="h-5 w-5" />,
};

const documentTypeLabels: Record<string, string> = {
  passport: "Pasaporte",
  visa: "Visa",
  insurance: "Seguro",
  ticket: "Boletos",
  voucher: "Vouchers",
  itinerary: "Itinerarios",
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(date));
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AppHomePage() {
  const { customer, token, hydrated } = useSessionStore();
  const [activeBookings, setActiveBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";

  const fetchActiveBookings = useCallback(async () => {
    if (!customer || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await http<BookingResponse[]>("/api/bookings", {
        headers: buildAuthHeaders(token),
      });
      // Filtrar solo viajes confirmados que estén por venir
      const active = response.filter(booking => {
        const days = daysUntil(booking.startDate);
        return booking.status === "CONFIRMED" && days !== null && days >= -7; // Incluir viajes hasta 7 días después de iniciados
      });
      setActiveBookings(active);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [customer, token]);

  useEffect(() => {
    if (hydrated && customer) {
      fetchActiveBookings();
    }
  }, [hydrated, customer, fetchActiveBookings]);

  if (customer && (isAdmin || isOperations)) {
    return (
      <main className="space-y-6">
        <section className="rounded-2xl bg-gradient-to-r from-[#7C7E9D] to-[#4C5372] p-6 text-white">
          <h1 className="text-3xl font-bold">Panel de administración</h1>
          <p className="mt-2 text-[#FFFDF6]/90">
            Esta cuenta está enfocada en administrar lo que ven los clientes, no en reservar viajes.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/app/admin/reservas" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
            <h2 className="font-semibold text-slate-900">Administrar reservas</h2>
            <p className="mt-1 text-sm text-[#7C7E9D]">Confirma, cancela y da seguimiento a reservas.</p>
          </Link>
          <Link href="/app/admin/pagos" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
            <h2 className="font-semibold text-slate-900">Administrar pagos</h2>
            <p className="mt-1 text-sm text-[#7C7E9D]">Monitorea pagos, estados y reembolsos.</p>
          </Link>
          <Link href="/app/admin/documentos" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
            <h2 className="font-semibold text-slate-900">Administrar documentos</h2>
            <p className="mt-1 text-sm text-[#7C7E9D]">Asigna y cambia documentos por cliente.</p>
          </Link>
          <Link href="/app/admin/catalogo" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
            <h2 className="font-semibold text-slate-900">Administrar catálogo</h2>
            <p className="mt-1 text-sm text-[#7C7E9D]">Controla paquetes, banners y medios.</p>
          </Link>
          <Link href="/app/admin/dome" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
            <h2 className="font-semibold text-slate-900">Administrar Dome</h2>
            <p className="mt-1 text-sm text-[#7C7E9D]">Gestiona promociones de la galería.</p>
          </Link>
          {isAdmin ? (
            <Link href="/app/admin/clientes" className="rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-5 shadow-sm transition hover:border-[#949AB1] hover:bg-[#E2D4E0]/40">
              <h2 className="font-semibold text-slate-900">Administrar clientes</h2>
              <p className="mt-1 text-sm text-[#7C7E9D]">Gestiona roles y contexto de usuarios.</p>
            </Link>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 overflow-x-hidden text-slate-900">
      {/* Welcome section */}
      <div className="rounded-2xl bg-gradient-to-r from-[#949AB1] to-[#4C5372] p-6 text-white shadow-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">¡Bienvenido de vuelta, {customer?.fullName || "Usuario"}!</h1>
          <p className="text-[#FFFDF6]/90">
            Gestiona tus reservas, pagos y encuentra tu próximo destino desde tu panel personal.
          </p>
        </div>
      </div>

      {/* Active Travel Tracking */}
      {customer && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
           <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
             <FaPlane className="h-5 w-5 text-[#4C5372]" />
              Seguimiento de viajes activos
            </h2>
            <Link
              href="/app/reservas"
               className="text-sm font-medium text-[#4C5372] hover:text-[#4C5372]/90"
            >
              Ver todos
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border border-[#E2D4E0] bg-white p-8 text-center">
               <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#4C5372]"></div>
              <p className="mt-2 text-sm text-[#7C7E9D]">Cargando viajes...</p>
            </div>
          ) : activeBookings.length > 0 ? (
            <div className="grid gap-4">
              {activeBookings.map((booking) => {
                const days = daysUntil(booking.startDate);
                const isOngoing = days !== null && days < 0;
                const isToday = days === 0;
                
                return (
                  <div key={booking.id} className="rounded-xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{booking.packageTitle}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#7C7E9D]">
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="h-4 w-4" />
                            {booking.originCode} → {booking.destinationCode}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCalendarCheck className="h-4 w-4" />
                            {formatDate(booking.startDate)}
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="mt-3">
                          {isOngoing ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E2D4E0] px-3 py-1 text-sm font-medium text-[#4C5372]">
                              <FaClock className="h-4 w-4" />
                              Viaje en progreso
                            </span>
                          ) : isToday ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E2D4E0] px-3 py-1 text-sm font-medium text-[#4C5372]">
                              <FaPlane className="h-4 w-4" />
                              ¡Viaje hoy!
                            </span>
                          ) : days && days <= 7 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                              <FaClock className="h-4 w-4" />
                              Próximo viaje ({days} días)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E2D4E0] px-3 py-1 text-sm font-medium text-[#4C5372]">
                              <FaCalendarCheck className="h-4 w-4" />
                              {days} días para viajar
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                           className="inline-flex items-center gap-2 rounded-lg bg-[#4C5372] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4C5372]/90"
                          onClick={() => {
                            // Generar PDF de viaje con información actualizada
                            alert("Generando documentos de viaje...");
                          }}
                        >
                          <FaDownload className="h-4 w-4" />
                          Descargar
                        </button>
                        <Link
                          href={`/app/reservas/${booking.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#949AB1] bg-white px-3 py-2 text-sm font-medium text-[#4C5372] transition-colors hover:bg-[#FFFDF6]"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#E2D4E0] bg-white p-8 text-center">
              <FaMapMarkerAlt className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-[#4C5372]">No tienes viajes próximos</h3>
              <p className="mt-1 text-sm text-[#949AB1]">¿Listo para tu próxima aventura?</p>
              <Link
                href="/"
                 className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#4C5372] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4C5372]/90"
              >
                <FaSearch className="h-4 w-4" />
                Buscar destinos
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Important Documents */}
      {customer && (
        <div className="space-y-4">
           <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
             <FaFileAlt className="h-5 w-5 text-[#4C5372]" />
            Documentos importantes
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockDocuments.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-[#E2D4E0] bg-[#FFFDF6] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#E2D4E0] p-2 text-[#4C5372]">
                    {documentTypeIcons[doc.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 text-sm truncate">{doc.name}</h4>
                    <p className="text-xs text-[#949AB1] mt-1">{documentTypeLabels[doc.type]}</p>
                    <button
                      onClick={() => window.open(doc.url, "_blank")}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-[#4C5372] transition-colors hover:bg-[#E2D4E0]"
                    >
                      <FaDownload className="h-3 w-3" />
                      Descargar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/app/documentos"
              className="inline-flex items-center gap-2 rounded-lg border border-[#949AB1] bg-white px-4 py-2 text-sm font-medium text-[#4C5372] transition-colors hover:bg-[#FFFDF6]"
            >
              <FaFileAlt className="h-4 w-4" />
              Ver todos los documentos
            </Link>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-[#E2D4E0] p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-[#4C5372]">{activeBookings.length}</div>
          <div className="text-sm text-[#949AB1]">Reservas activas</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2D4E0] p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-[#4C5372]">0</div>
          <div className="text-sm text-[#949AB1]">Pagos pendientes</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2D4E0] p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-[#4C5372]">0</div>
          <div className="text-sm text-[#949AB1]">Incidencias abiertas</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E2D4E0] p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-[#4C5372]">$0</div>
          <div className="text-sm text-[#949AB1]">Total invertido</div>
        </div>
      </div>

      {/* Main actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#4C5372]">Acciones principales</h2>
        
        <div className={`grid gap-6 ${isAdmin ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          <Link
            href="/app/reservas"
            className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-[#949AB1] hover:bg-[#E2D4E0]/40"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#E2D4E0] p-3 group-hover:bg-[#949AB1]/40 transition-colors">
                <FaCalendarCheck className="h-6 w-6 text-[#4C5372]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Mis reservas</h3>
                <p className="text-sm text-[#7C7E9D]">Ver y gestionar tus viajes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-[#949AB1] hover:bg-[#E2D4E0]/40"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#E2D4E0] p-3 group-hover:bg-[#949AB1]/40 transition-colors">
                <FaSearch className="h-6 w-6 text-[#4C5372]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Buscar viajes</h3>
                <p className="text-sm text-[#7C7E9D]">Descubre nuevos destinos</p>
              </div>
            </div>
          </Link>

          <Link
            href="/app/pagos"
            className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-[#949AB1] hover:bg-[#E2D4E0]/40"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#E2D4E0] p-3 transition-colors group-hover:bg-[#949AB1]/40">
                <FaCreditCard className="h-6 w-6 text-[#4C5372]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Pagos</h3>
                <p className="text-sm text-[#7C7E9D]">Historial y facturas</p>
              </div>
            </div>
          </Link>

          <Link
            href="/app/soporte"
            className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200 hover:bg-purple-50"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                <FaHeadset className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Soporte</h3>
                <p className="text-sm text-[#7C7E9D]">Ayuda y asistencia</p>
              </div>
            </div>
          </Link>

          {(isAdmin || isOperations) && (
            <>
              <Link
                href="/app/admin/clientes"
                className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-[#949AB1] hover:bg-[#E2D4E0]/40"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-[#E2D4E0] p-3 group-hover:bg-[#949AB1]/40 transition-colors">
                    <FaUsers className="h-6 w-6 text-[#4C5372]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Clientes</h3>
                    <p className="text-sm text-[#7C7E9D]">Gestión de usuarios</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/app/admin/dashboard"
                className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-[#949AB1] hover:bg-[#E2D4E0]/40"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-[#E2D4E0] p-3 transition-colors group-hover:bg-[#949AB1]/40">
                    <FaChartLine className="h-6 w-6 text-[#4C5372]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Analytics</h3>
                    <p className="text-sm text-[#7C7E9D]">Reportes y estadísticas</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              href="/app/admin/dome"
              className="group rounded-2xl border border-[#E2D4E0] bg-[#FFFDF6] p-6 shadow-sm transition-all hover:shadow-md hover:border-pink-200 hover:bg-pink-50"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-pink-100 p-3 group-hover:bg-pink-200 transition-colors">
                  <FaImages className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Dome Gallery</h3>
                  <p className="text-sm text-[#7C7E9D]">Gestionar imágenes</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
