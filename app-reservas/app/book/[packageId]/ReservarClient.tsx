"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCheckoutForm from "./StripeCheckoutForm";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

interface TravelPackage {
  id: number;
  title: string;
  description: string;
  originCode: string;
  destinationCode: string;
  basePrice: number;
  coverImageUrl: string;
  active: boolean;
}

interface BookingResponse {
  id: number;
  packageTitle: string;
  originCode: string;
  destinationCode: string;
  customerName: string;
  startDate: string | null;
  endDate: string | null;
  totalPrice: number;
  status: string;
}

interface PaymentIntentResponse {
  paymentId: number;
  providerPaymentId: string;
  clientSecret: string;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export default function ReservarClient({ packageId }: { packageId: number }) {
  const router = useRouter();
  const { customer, hydrated, token, logout } = useSessionStore();
  
  const [pkg, setPkg] = useState<TravelPackage | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Form data
  const [travelers, setTravelers] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const stripePromise = useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, []);

  // Load package details
  useEffect(() => {
    async function loadPackage() {
      try {
        setLoading(true);
        const response = await http<TravelPackage>(`/api/packages/${packageId}`);
        setPkg(response);
      } catch (err) {
        console.error("Error loading package:", err);
        setError("No pudimos cargar los detalles del paquete.");
      } finally {
        setLoading(false);
      }
    }
    
    void loadPackage();
  }, [packageId]);

  // Create booking
  const createBooking = useCallback(async () => {
    if (!customer || !token || !pkg) {
      return;
    }

    if (!startDate || !endDate) {
      setError("Por favor selecciona las fechas de tu viaje.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const bookingData = {
        packageId: pkg.id,
        startDate,
        endDate,
        totalPrice: totalPrice,
      };

      const bookingResponse = await http<BookingResponse>("/api/bookings", {
        method: "POST",
        headers: {
          ...buildAuthHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      setBooking(bookingResponse);
      
      // Create payment intent
      const paymentResponse = await http<PaymentIntentResponse>(
        `/api/payments/stripe/intent?bookingId=${bookingResponse.id}&idempotencyKey=stripe-booking-${bookingResponse.id}-1`,
        { method: "POST", headers: buildAuthHeaders(token) }
      );
      
      setIntent(paymentResponse);
      setStatusMessage("Reserva creada. Procede con el pago para confirmar.");
      
    } catch (err) {
      console.error("Error creating booking:", err);
      if (isHttpErrorStatus(err, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente.");
      } else {
        setError("No pudimos crear la reserva. Por favor intenta nuevamente.");
      }
    } finally {
      setCreating(false);
    }
  }, [customer, token, pkg, startDate, endDate, travelers, specialRequests, logout]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-xl border border-amber-400/30 bg-amber-50 p-6 text-sm text-amber-900">
            <strong>Error de configuración:</strong> Falta configurar la clave pública de Stripe.
            <br />
            <code className="mt-2 block rounded bg-amber-100 px-2 py-1">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Cargando sesión...
          </div>
        </div>
      </div>
    );
  }

  if (!customer || !token) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-50 p-6 text-sm text-amber-900">
              <h3 className="font-semibold">Inicio de sesión requerido</h3>
              <p className="mt-2">
                Necesitas iniciar sesión para realizar una reserva.
              </p>
            </div>
            <Link
              href="/app/login"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-700"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
            <p className="mt-3 text-sm">Cargando detalles del paquete...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !pkg) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-400/30 bg-red-50 p-6 text-sm text-red-900">
              {error}
            </div>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
            >
              ← Volver a paquetes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return null;
  }

  const totalPrice = pkg.basePrice * travelers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/trip/${packageId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-teal-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al detalle del paquete
          </Link>
          
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            Reserva tu viaje
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Completa los detalles y confirma tu pago con Stripe
          </p>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className="mb-6 rounded-xl border border-blue-400/30 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {statusMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column - Package Details & Booking Form */}
          <div className="space-y-6">
            {/* Package Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-200">
                {pkg.coverImageUrl ? (
                  <img
                    src={pkg.coverImageUrl}
                    alt={pkg.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
                    <svg className="h-20 w-20 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                
                {/* Route Badge */}
                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <span>{pkg.originCode}</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span>{pkg.destinationCode}</span>
                </div>
              </div>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900">{pkg.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {pkg.description}
                </p>
                
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-sm text-slate-500">Precio base:</span>
                  <span className="text-2xl font-bold text-teal-600">{formatMoney(pkg.basePrice)}</span>
                  <span className="text-sm text-slate-500">por persona</span>
                </div>
              </div>
            </div>

            {/* Booking Form - Only show if no booking yet */}
            {!booking && (
              <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
                <h3 className="text-xl font-bold text-slate-900">Detalles de tu reserva</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Completa la información para continuar con el pago
                </p>
                
                <div className="mt-6 space-y-4">
                  {/* Number of Travelers */}
                  <div>
                    <label htmlFor="travelers" className="block text-sm font-medium text-slate-700">
                      Número de viajeros
                    </label>
                    <input
                      type="number"
                      id="travelers"
                      min="1"
                      max="10"
                      value={travelers}
                      onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
                      Fecha de salida
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
                      Fecha de regreso
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label htmlFor="requests" className="block text-sm font-medium text-slate-700">
                      Solicitudes especiales (opcional)
                    </label>
                    <textarea
                      id="requests"
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Ej: Celebración, dieta especial, accesibilidad..."
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={createBooking}
                    disabled={creating || !startDate || !endDate}
                    className="mt-4 w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Creando reserva...
                      </span>
                    ) : (
                      "Continuar al pago"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              <h3 className="text-lg font-bold text-slate-900">Resumen</h3>
              
              <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Precio por persona</span>
                  <span className="font-medium text-slate-900">{formatMoney(pkg.basePrice)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Número de viajeros</span>
                  <span className="font-medium text-slate-900">{travelers}</span>
                </div>
                
                {startDate && endDate && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Salida</span>
                      <span className="font-medium text-slate-900">
                        {new Date(startDate).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Regreso</span>
                      <span className="font-medium text-slate-900">
                        {new Date(endDate).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-teal-600">{formatMoney(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Incluye</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hospedaje 5 noches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Traslados aeropuerto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Desayunos incluidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Seguro de viaje</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            {booking && intent && (
              <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
                <h3 className="text-lg font-bold text-slate-900">Información de pago</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Reserva #{booking.id} - {booking.status}
                </p>
                
                <div className="mt-6">
                  <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
                    <StripeCheckoutForm
                      bookingId={booking.id}
                      clientSecret={intent.clientSecret}
                      totalAmount={totalPrice}
                      onPaymentSuccess={() => {
                        setStatusMessage("¡Pago procesado exitosamente! Redirigiendo...");
                        setTimeout(() => {
                          router.push(`/app/bookings`);
                        }, 2000);
                      }}
                    />
                  </Elements>
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Pago seguro procesado por Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
