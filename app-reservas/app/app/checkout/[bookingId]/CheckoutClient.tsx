"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type { BookingResponse, PaymentIntentResponse } from "@/features/search/types";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(date));
}

export default function CheckoutClient({ bookingId }: { bookingId: number }) {
  const { customer, hydrated, token, logout } = useSessionStore();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [awaitingWebhookConfirmation, setAwaitingWebhookConfirmation] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const stripePromise = useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return publishableKey ? loadStripe(publishableKey) : null;
  }, []);

  const loadBooking = useCallback(async (showRefreshMessage = false, silent = false) => {
    try {
      if (showRefreshMessage) {
        setRefreshingStatus(true);
      } else if (!silent) {
        setLoading(true);
      }

      const bookingResponse = await http<BookingResponse>(`/api/bookings/${bookingId}`, {
        headers: buildAuthHeaders(token),
      });
      setBooking(bookingResponse);
      if (bookingResponse.status === "CONFIRMED") {
        setAwaitingWebhookConfirmation(false);
      }

      if (showRefreshMessage) {
        setStatusMessage(`Estado actualizado: ${bookingResponse.status}.`);
      } else if (silent && bookingResponse.status === "CONFIRMED") {
        setStatusMessage("Pago confirmado. Tu reserva ya aparece como CONFIRMED.");
      }
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para abrir el checkout.");
      } else {
        setError("No pudimos cargar la reserva actual.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshingStatus(false);
    }
  }, [bookingId, logout, token]);

  const ensurePaymentIntent = useCallback(async () => {
    if (!customer || !token) {
      return;
    }

    try {
      const paymentResponse = await http<PaymentIntentResponse>(
        `/api/payments/stripe/intent?bookingId=${bookingId}&idempotencyKey=stripe-booking-${bookingId}-1`,
        { method: "POST", headers: buildAuthHeaders(token) },
      );
      setIntent(paymentResponse);
    } catch (intentError) {
      console.error(intentError);
      if (isHttpErrorStatus(intentError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar el pago.");
      } else {
        setError("No pudimos preparar el pago con Stripe. Revisa el backend y las llaves.");
      }
    }
  }, [bookingId, customer, logout, token]);

  useEffect(() => {
    if (!hydrated || !customer || !token) {
      return;
    }

    async function bootstrapCheckout() {
      setError(null);
      setStatusMessage(null);
      await loadBooking(false);
      await ensurePaymentIntent();
    }

    void bootstrapCheckout();
  }, [bookingId, customer, ensurePaymentIntent, hydrated, loadBooking, token]);

  useEffect(() => {
    if (!awaitingWebhookConfirmation || booking?.status === "CONFIRMED") {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void loadBooking(false, true);

      if (attempts >= 15) {
        window.clearInterval(intervalId);
        setAwaitingWebhookConfirmation(false);
        setStatusMessage(
          "Stripe ya recibio el pago, pero la confirmacion final del webhook aun no llega. Puedes actualizar el estado manualmente en unos segundos.",
        );
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [awaitingWebhookConfirmation, booking?.status, loadBooking]);

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm">
        Falta configurar <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        Cargando sesión...
      </div>
    );
  }

  if (!customer || !token) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Necesitas iniciar sesión para abrir este checkout.
        </div>
        <Link href="/app/perfil" className="text-sm text-zinc-300 underline">
          Ir a perfil
        </Link>
      </div>
    );
  }

  if (loading && !booking) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        Cargando checkout...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
          {error ?? "No pudimos abrir el checkout."}
        </div>
        <Link href="/app/reservas" className="text-sm text-zinc-300 underline">
          Volver a reservas
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === "CONFIRMED";
  const isCancelled = booking.status === "CANCELLED";

  async function cancelBooking() {
    if (!token) {
      return;
    }

    try {
      setCancelling(true);
      setError(null);
      const updated = await http<BookingResponse>(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      setBooking(updated);
      setIntent(null);
      setAwaitingWebhookConfirmation(false);
      setStatusMessage("La reserva fue cancelada. Si hubo un intento de pago pendiente, quedó invalidado.");
    } catch (cancelError) {
      console.error(cancelError);
      if (isHttpErrorStatus(cancelError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para cancelar la reserva.");
      } else {
        setError("No pudimos cancelar la reserva desde el checkout.");
      }
    } finally {
      setCancelling(false);
    }
  }

  async function refundBooking() {
    if (!token) {
      return;
    }

    try {
      setRefunding(true);
      setError(null);
      const updated = await http<BookingResponse>(`/api/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: buildAuthHeaders(token),
      });
      setBooking(updated);
      setIntent(null);
      setAwaitingWebhookConfirmation(false);
      setStatusMessage("El pago fue reembolsado y la reserva quedó cancelada.");
    } catch (refundError) {
      console.error(refundError);
      if (isHttpErrorStatus(refundError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para reembolsar la reserva.");
      } else {
        setError("No pudimos procesar el reembolso de la reserva.");
      }
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout de reserva #{booking.id}</h1>
          <p className="text-sm text-zinc-400">
            Revisa el estado de la reserva y confirma el pago si aún sigue pendiente.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/app/reservas"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            Ver reservas
          </Link>
          <button
            type="button"
            onClick={() => void loadBooking(true)}
            disabled={refreshingStatus}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15 disabled:opacity-60"
          >
            {refreshingStatus ? "Actualizando..." : "Actualizar estado"}
          </button>
          {booking.status === "PENDING" ? (
            <button
              type="button"
              onClick={() => void cancelBooking()}
              disabled={cancelling}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {cancelling ? "Cancelando..." : "Cancelar reserva"}
            </button>
          ) : null}
          {booking.status === "CONFIRMED" ? (
            <button
              type="button"
              onClick={() => void refundBooking()}
              disabled={refunding}
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
            >
              {refunding ? "Reembolsando..." : "Reembolsar reserva"}
            </button>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Paquete</div>
              <div className="text-lg font-semibold">{booking.packageTitle}</div>
            </div>

            <div className="grid gap-2 text-sm text-zinc-300">
              <div>Ruta: {booking.originCode} → {booking.destinationCode}</div>
              <div>Cliente: {booking.customerName}</div>
              <div>Salida: {formatDate(booking.startDate)}</div>
              <div>Regreso: {formatDate(booking.endDate)}</div>
              <div>Total: {formatMoney(booking.totalPrice)}</div>
              <div>Estado: {booking.status}</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Estado del pago</h2>
            <p className="mt-2 text-sm text-zinc-400">
              El webhook del backend cambiará la reserva a <strong>CONFIRMED</strong> cuando Stripe confirme el pago.
            </p>
          </div>

          {isConfirmed ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
              La reserva ya está confirmada. Si el cliente ya no viajará, puedes solicitar el reembolso desde aquí.
            </div>
          ) : isCancelled ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-100">
              La reserva fue cancelada. Este checkout quedó deshabilitado para evitar pagos posteriores.
            </div>
          ) : intent ? (
            <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
              <CheckoutForm
                bookingId={booking.id}
                clientSecret={intent.clientSecret}
                onPaymentSubmitted={(paymentStatus) => {
                  setAwaitingWebhookConfirmation(true);
                  setStatusMessage(
                    paymentStatus === "succeeded"
                      ? "Stripe aprobo el pago. Estamos esperando la confirmacion final del webhook..."
                      : "Pago enviado a Stripe. Revisaremos automaticamente el estado de tu reserva.",
                  );
                  void loadBooking(false, true);
                }}
              />
            </Elements>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              Preparando intent de pago...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
