"use client";

import Link from "next/link";
import { useSessionStore } from "@/lib/session-store";
import { 
  FaCalendarCheck, 
  FaSearch, 
  FaCreditCard, 
  FaHeadset, 
  FaUserCog,
  FaUsers,
  FaChartLine,
  FaImages
} from "react-icons/fa";

export default function AppHomePage() {
  const customer = useSessionStore((state) => state.customer);
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";

  return (
    <main className="space-y-8">
      {/* Welcome section */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">¡Bienvenido de vuelta, {customer?.fullName || "Usuario"}!</h1>
          <p className="text-teal-100">
            Gestiona tus reservas, pagos y encuentra tu próximo destino desde tu panel personal.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-700">0</div>
          <div className="text-sm text-slate-500">Reservas activas</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-700">0</div>
          <div className="text-sm text-slate-500">Pagos pendientes</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-700">0</div>
          <div className="text-sm text-slate-500">Incidencias abiertas</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-2xl font-bold text-teal-600">$0</div>
          <div className="text-sm text-slate-500">Total invertido</div>
        </div>
      </div>

      {/* Main actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-700">Acciones principales</h2>
        
        <div className={`grid gap-6 ${isAdmin ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          <Link
            href="/app/bookings"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-teal-200 hover:bg-teal-50"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-teal-100 p-3 text-teal-600 group-hover:bg-teal-200">
                <FaCalendarCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-slate-700 group-hover:text-teal-700">Ver reservas</div>
                <p className="mt-1 text-sm text-slate-500">
                  Revisa el historial actual, estados y accesos rápidos al checkout.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600 group-hover:bg-emerald-200">
                <FaSearch className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-slate-700 group-hover:text-emerald-700">Buscar paquetes</div>
                <p className="mt-1 text-sm text-slate-500">
                  Regresa al buscador principal para encontrar nuevos destinos.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/app/payments"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600 group-hover:bg-blue-200">
                <FaCreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-slate-700 group-hover:text-blue-700">Ver pagos</div>
                <p className="mt-1 text-sm text-slate-500">
                  Consulta cobros, reembolsos y el estado financiero de tus reservas.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/app/incidents"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-orange-200 hover:bg-orange-50"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-orange-100 p-3 text-orange-600 group-hover:bg-orange-200">
                <FaHeadset className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-slate-700 group-hover:text-orange-700">Ver incidencias</div>
                <p className="mt-1 text-sm text-slate-500">
                  Sigue tickets abiertos por soporte y responde desde tu cuenta.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Admin section */}
      {(isAdmin || isOperations) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-700">
            {isAdmin ? "Panel administrativo" : "Panel de operaciones"}
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/app/admin"
              className="group rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm transition-all hover:shadow-md hover:from-indigo-100 hover:to-purple-100"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600 group-hover:bg-indigo-200">
                  <FaChartLine className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-slate-700 group-hover:text-indigo-700">
                    {isAdmin ? "Dashboard admin" : "Operaciones"}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Revisa métricas, reservas recientes y clientes registrados.
                  </p>
                </div>
              </div>
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/app/admin/customers"
                  className="group rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md hover:from-purple-100 hover:to-pink-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-purple-100 p-3 text-purple-600 group-hover:bg-purple-200">
                      <FaUsers className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-slate-700 group-hover:text-purple-700">Gestionar clientes</div>
                      <p className="mt-1 text-sm text-slate-500">
                        Busca usuarios, revisa historial y ajusta roles.
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/app/admin/catalog"
                  className="group rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-6 shadow-sm transition-all hover:shadow-md hover:from-pink-100 hover:to-rose-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-pink-100 p-3 text-pink-600 group-hover:bg-pink-200">
                      <FaImages className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-slate-700 group-hover:text-pink-700">Gestionar catálogo</div>
                      <p className="mt-1 text-sm text-slate-500">
                        Sube portadas de paquetes y banners de la galería.
                      </p>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-700">Mi perfil</h3>
            <p className="mt-1 text-sm text-slate-500">
              Actualiza tu información personal y preferencias de viaje.
            </p>
          </div>
          <Link
            href="/app/profile"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FaUserCog className="h-4 w-4" />
            Editar perfil
          </Link>
        </div>
      </div>
    </main>
  );
}
