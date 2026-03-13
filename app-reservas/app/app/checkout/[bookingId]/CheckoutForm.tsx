"use client";

import { useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function CheckoutForm({
  bookingId,
  clientSecret,
  onPaymentSubmitted,
}: {
  bookingId: number;
  clientSecret: string;
  onPaymentSubmitted?: (paymentStatus: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const card = elements.getElement(CardElement);
    if (!card) {
      setMessage("No se pudo cargar el formulario de tarjeta.");
      setLoading(false);
      return;
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      setMessage(result.error.message ?? "El pago no pudo procesarse.");
    } else {
      const paymentStatus = result.paymentIntent?.status ?? null;
      setMessage(
        paymentStatus === "succeeded"
          ? "Pago aprobado por Stripe. Estamos confirmando tu reserva..."
          : "Pago enviado a Stripe. Esperando confirmacion final del backend...",
      );
      onPaymentSubmitted?.(paymentStatus);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Pagar reserva #{bookingId}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Usa una tarjeta de prueba de Stripe para completar el flujo. Ejemplo: <code>4242 4242 4242 4242</code>.
      </p>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <CardElement />
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={!stripe || loading}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Procesando..." : "Pagar ahora"}
      </button>

      {message ? <p className="mt-3 text-sm text-zinc-200">{message}</p> : null}
    </div>
  );
}
