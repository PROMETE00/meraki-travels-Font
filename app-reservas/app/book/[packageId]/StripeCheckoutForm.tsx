"use client";

import { useState, useEffect } from "react";
import { 
  PaymentElement, 
  useElements, 
  useStripe 
} from "@stripe/react-stripe-js";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { 
    style: "currency", 
    currency: "MXN" 
  }).format(amount);
}

export default function StripeCheckoutForm({
  bookingId,
  clientSecret,
  totalAmount,
  onPaymentSuccess,
}: {
  bookingId: number;
  clientSecret: string;
  totalAmount: number;
  onPaymentSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check if Payment Element is ready
  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [stripe, elements]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage("El sistema de pagos aún no está listo. Espera un momento.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/bookings`,
      },
      redirect: "if_required",
    });

    if (error) {
      // Payment failed
      setMessage(error.message ?? "El pago no pudo procesarse. Verifica los datos de tu tarjeta.");
      setIsError(true);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment succeeded
      setMessage("¡Pago confirmado! Tu reserva ha sido procesada exitosamente.");
      setIsError(false);
      onPaymentSuccess?.();
    } else {
      // Payment requires additional action or is processing
      setMessage("Pago enviado. Esperando confirmación...");
      setIsError(false);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element Container */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
          }}
        />
      </div>

      {/* Test Card Info */}
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        <p className="font-semibold">💳 Tarjetas de prueba Stripe:</p>
        <ul className="mt-2 space-y-1">
          <li>
            <code className="rounded bg-blue-100 px-2 py-0.5">4242 4242 4242 4242</code> - Pago exitoso
          </li>
          <li>
            <code className="rounded bg-blue-100 px-2 py-0.5">4000 0025 0000 3155</code> - Requiere 3D Secure
          </li>
        </ul>
        <p className="mt-2 text-blue-700">Usa cualquier fecha futura y CVV (ej: 123)</p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-red-400/30 bg-red-50 text-red-900"
              : "border-emerald-400/30 bg-emerald-50 text-emerald-900"
          }`}
        >
          <div className="flex items-start gap-2">
            {isError ? (
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !isReady || loading}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl hover:shadow-teal-600/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Procesando pago...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagar {formatMoney(totalAmount)} ahora
          </span>
        )}
        
        {/* Shine Effect */}
        <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
      </button>

      {/* Security Notice */}
      <p className="text-center text-xs text-slate-500">
        Al confirmar el pago, aceptas nuestros términos de servicio.
        <br />
        Este pago es procesado de forma segura por Stripe.
      </p>
    </form>
  );
}
