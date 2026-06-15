"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type TravelDetail = {
  id: number;
  title: string;
  description: string | null;
  originCode: string | null;
  destinationCode: string | null;
  basePrice: number;
  coverImageUrl: string | null;
  active: boolean;
};

export default function TravelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [travel, setTravel] = useState<TravelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTravel = async () => {
      try {
        const response = await fetch(`/api/packages/${id}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("No se pudo cargar el viaje");
        }
        const data = await response.json();
        setTravel(data);
      } catch (err) {
        console.error("Error loading travel:", err);
        setError("No se encontró el viaje solicitado");
      } finally {
        setLoading(false);
      }
    };
    loadTravel();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleReserve = () => {
    // Redirigir a la nueva página de reserva con Stripe
    router.push(`/book/${id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500"></div>
            <p className="text-slate-600">Cargando detalles del viaje...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !travel) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Viaje no encontrado</h1>
            <p className="mb-6 text-slate-600">{error}</p>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 font-semibold text-white transition-all hover:bg-teal-700"
            >
              Ver todos los paquetes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Navbar />

      {/* Hero Image Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        {travel.coverImageUrl ? (
          <img
            src={travel.coverImageUrl}
            alt={travel.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
            <svg className="h-32 w-32 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        
        {/* Route Badge */}
        {travel.originCode && travel.destinationCode && (
          <div className="absolute left-6 top-24 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm">
            <span className="font-semibold text-slate-900">{travel.originCode}</span>
            <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="font-semibold text-slate-900">{travel.destinationCode}</span>
          </div>
        )}

        {/* Title & Price */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              {travel.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-2xl bg-white/95 px-6 py-3 backdrop-blur-sm">
                <span className="text-sm font-medium text-slate-600">Desde</span>
                <p className="text-3xl font-bold text-teal-600">{formatPrice(travel.basePrice)}</p>
                <span className="text-xs text-slate-500">por persona</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left Column - Details */}
          <div className="space-y-8">
            {/* Description */}
            <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">Descripción del viaje</h2>
              {travel.description ? (
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                  {travel.description}
                </p>
              ) : (
                <p className="text-slate-500 italic">Sin descripción disponible</p>
              )}
            </div>

            {/* What's Included */}
            <div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">¿Qué incluye?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: "🚐", title: "Traslados", desc: "Aeropuerto - Hotel - Aeropuerto" },
                  { icon: "🏨", title: "Hospedaje", desc: "Hotel seleccionado" },
                  { icon: "🍽️", title: "Alimentación", desc: "Según plan contratado" },
                  { icon: "🎯", title: "Actividades", desc: "Tours y experiencias" },
                  { icon: "🛡️", title: "Seguro", desc: "Cobertura de viaje" },
                  { icon: "📞", title: "Asistencia 24/7", desc: "Soporte durante tu viaje" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Information */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 ring-1 ring-amber-200/60">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Información importante</h2>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Los precios están sujetos a disponibilidad y pueden variar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Se requiere depósito del 50% para confirmar reserva</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Cancelación con al menos 15 días de anticipación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Documentación de viaje requerida según destino</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60">
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-slate-600">Precio por persona</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">{formatPrice(travel.basePrice)}</p>
                <p className="mt-1 text-xs text-slate-500">Precios en MXN</p>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-700">Disponibilidad</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Disponible
                  </span>
                </div>
              </div>

              <button
                onClick={handleReserve}
                className="mb-4 w-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 font-semibold text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/40"
              >
                Reservar ahora
              </button>

              <Link
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5215512345678"}?text=Hola,%20me%20interesa%20información%20sobre%20este%20viaje`}
                target="_blank"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-4 font-semibold text-slate-900 transition-all hover:border-emerald-500 hover:bg-emerald-50"
              >
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </Link>

              <div className="mt-6 space-y-2 text-center text-xs text-slate-500">
                <p className="flex items-center justify-center gap-1">
                  <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reserva 100% segura
                </p>
                <p>Confirmación inmediata</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gradient-to-br from-slate-800 to-slate-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            ¿Tienes dudas sobre este viaje?
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Nuestro equipo está listo para ayudarte a planificar la experiencia perfecta
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/packages"
              className="rounded-full bg-white px-8 py-4 font-semibold text-slate-900 transition-all hover:bg-slate-100"
            >
              Ver más destinos
            </Link>
            <a
href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5215512345678"}`}
                target="_blank"
                className="rounded-full border-2 border-white bg-transparent px-8 py-4 font-semibold text-white transition-all hover:bg-white hover:text-slate-900"
            >
              Contactar asesor
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/meraki.svg"
                alt="Meraki Travels"
                width={140}
                height={48}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-teal-600">Inicio</Link>
              <Link href="/packages" className="hover:text-teal-600">Paquetes</Link>
              <Link href="/app/login" className="hover:text-teal-600">Mi cuenta</Link>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 Meraki Travels
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
