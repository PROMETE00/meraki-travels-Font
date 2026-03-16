 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

type TravelPackage = {
  id: number;
  title: string;
  description: string | null;
  originCode: string | null;
  destinationCode: string | null;
  basePrice: number;
  coverImageUrl: string | null;
  active: boolean;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-animate='reveal']")
    );
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [packages]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch("/api/packages", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setPackages(data.filter((pkg: TravelPackage) => pkg.active));
        }
      } catch (error) {
        console.error("Error loading packages:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPackages();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-28">
        <div className="reveal space-y-4 text-center" data-animate="reveal">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 ring-1 ring-teal-200">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Explora Destinos
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Descubre tu próxima <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">aventura</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Paquetes de viaje diseñados para crear experiencias inolvidables. 
            Hospedaje, actividades y todo lo que necesitas en un solo lugar.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500"></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-100">
              <svg className="h-10 w-10 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-6 text-xl font-semibold text-slate-700">
              Próximamente más paquetes
            </p>
            <p className="mt-2 text-slate-500">
              Estamos preparando experiencias increíbles para ti.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-teal-700"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <Link
                key={pkg.id}
                href={`/viaje/${pkg.id}`}
                className="reveal group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-200/30 hover:ring-teal-300"
                data-animate="reveal"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  {pkg.coverImageUrl ? (
                    <img
                      src={pkg.coverImageUrl}
                      alt={pkg.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
                      <svg className="h-20 w-20 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Price Badge */}
                  <div className="absolute right-4 top-4 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                    <span className="text-xl font-bold text-slate-900">{formatPrice(pkg.basePrice)}</span>
                  </div>

                  {/* Route Badge */}
                  {pkg.originCode && pkg.destinationCode && (
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <span>{pkg.originCode}</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span>{pkg.destinationCode}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-teal-700">
                    {pkg.title}
                  </h2>
                  {pkg.description && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {pkg.description}
                    </p>
                  )}
                  
                  {/* CTA */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Reserva segura</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:text-teal-700">
                      Ver detalles
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="reveal grid gap-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-2xl md:grid-cols-[1.2fr_1fr]" data-animate="reveal">
          <div>
            <h3 className="text-2xl font-bold">
              ¿Por qué reservar con nosotros?
            </h3>
            <p className="mt-2 text-slate-300">
              Beneficios exclusivos en cada paquete de viaje.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                { icon: "🚐", title: "Traslados incluidos", desc: "Aeropuerto - hotel - aeropuerto" },
                { icon: "🏨", title: "Hospedaje premium", desc: "Hoteles seleccionados" },
                { icon: "🎯", title: "Actividades", desc: "Tours y experiencias únicas" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm text-slate-300">Clientes satisfechos</p>
              <p className="mt-2 text-4xl font-bold">+2,500</p>
              <p className="mt-2 text-sm text-slate-300">
                Viajeros que confían en Meraki Travels
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-white px-6 py-3.5 text-center font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Volver al inicio
            </Link>
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
              <Link href="/app/acceder" className="hover:text-teal-600">Mi cuenta</Link>
              <a href="#" className="hover:text-teal-600">Términos</a>
              <a href="#" className="hover:text-teal-600">Privacidad</a>
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
