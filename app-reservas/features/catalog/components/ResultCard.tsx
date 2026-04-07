"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import merakiImageLoader from "@/lib/image-loader";
import { http, isHttpErrorStatus } from "@/lib/http";
import { useStore } from "@/lib/store";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type { BookingResponse, SearchResultItem } from "@/features/search/types";

/**
 * Tarjeta de resultado para la lista del catálogo de viajes.
 * Optimizada para carga rápida y visualización responsiva.
 */
export default function ResultCard({ item }: { item: SearchResultItem }) {
  const router = useRouter();
  const { criteria } = useStore();
  const { customer, token, logout } = useSessionStore((state) => ({
    customer: state.customer,
    token: state.token,
    logout: state.logout,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cálculo de fechas sugeridas según criterios de búsqueda
  const tripDates = useMemo(() => {
    const startDate = criteria.dateFrom || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const endDate = criteria.dateTo || new Date(Date.now() + 11 * 86400000).toISOString().slice(0, 10);
    return { startDate, endDate };
  }, [criteria.dateFrom, criteria.dateTo]);

  /**
   * Intenta crear una reserva para el paquete seleccionado.
   */
  async function reservePackage() {
    if (!customer || !token) {
      router.push("/app/profile");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const booking = await http<BookingResponse>("/api/bookings", {
        method: "POST",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          packageId: item.id,
          startDate: tripDates.startDate,
          endDate: tripDates.endDate,
        }),
      });

      router.push(`/app/checkout/${booking.id}`);
    } catch (reservationError) {
      console.error(reservationError);
      if (isHttpErrorStatus(reservationError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para reservar.");
        router.push("/app/profile");
      } else {
        setError("No pudimos crear la reserva. Revisa que el backend esté arriba y tu sesión siga activa.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          {item.coverImageUrl ? (
            <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-white/10">
              <Image
                loader={merakiImageLoader}
                src={item.coverImageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 128px"
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <div className="font-semibold">{item.title}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {item.originCode} → {item.destinationCode}
            </div>
            {item.description ? (
              <p className="max-w-xl text-sm text-zinc-300">{item.description}</p>
            ) : null}
          </div>
        </div>

        <div className="min-w-[120px] text-right">
          <div className="text-xs text-zinc-400">{item.type}</div>
          <div className="text-lg font-bold">${item.price}</div>
          <button
            type="button"
            onClick={reservePackage}
            disabled={submitting}
            className="mt-2 rounded-lg border border-white/20 px-3 py-1 text-xs transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creando..." : customer && token ? "Reservar" : "Entrar para reservar"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
