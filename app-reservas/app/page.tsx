"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import BannersBackgroundCarousel from "@/components/BannersBackgroundCarousel";
import Navbar from "@/components/Navbar";
import SearchNav from "@/components/ui/SearchNav";
import AppDome from "@/components/AppDome";

export default function Home() {
  const [navH, setNavH] = useState(0);
  const expanded = navH > 170;
  const [promotions, setPromotions] = useState<PromoBanner[]>([]);
  const [promosError, setPromosError] = useState<string | null>(null);

  type PromoBanner = {
    id: number;
    title: string | null;
    subtitle: string | null;
    altText: string | null;
    linkUrl: string | null;
    imageUrl: string;
    orderIndex: number;
    isActive: boolean;
  };

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
  }, []);

  useEffect(() => {
    let active = true;
    const loadPromotions = async () => {
      try {
        setPromosError(null);
        const response = await fetch("/api/banners", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("No pudimos cargar las promociones.");
        }
        const payload = (await response.json()) as PromoBanner[];
        if (active) {
          setPromotions(
            payload
              .filter((item) => item.isActive)
              .sort((a, b) => a.orderIndex - b.orderIndex)
          );
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setPromosError("No pudimos cargar las promociones.");
        }
      }
    };
    void loadPromotions();
    return () => {
      active = false;
    };
  }, []);


  const domeStyle: React.CSSProperties = expanded
    ? {
        marginTop: "0rem",
        height: "clamp(520px, 68svh, 760px)",
        transition:
          "margin-top 380ms cubic-bezier(.22,.61,.36,1), height 380ms cubic-bezier(.22,.61,.36,1)",
        willChange: "margin-top,height",
      }
    : {
        marginTop: "clamp(-4rem, -6vh, -2rem)",
        height: "clamp(560px, 74svh, 820px)",
        transition:
          "margin-top 380ms cubic-bezier(.22,.61,.36,1), height 380ms cubic-bezier(.22,.61,.36,1)",
        willChange: "margin-top,height",
      };

  return (
    <div className="relative">
      {/* Background Carousel - sin indicadores */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <BannersBackgroundCarousel
          intervalMs={5000}
          transition="fade"
          className="h-[100svh] w-screen"
          showArrows={false}
          showDots={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/55 via-slate-900/30 to-slate-200/20" />
      </div>

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-0 pb-12">
        {/* Search Navigation */}
        <div className="mx-auto max-w-4xl px-9">
          <SearchNav topRem={0.75} onHeightChange={setNavH} />
        </div>

        {/* Dome Gallery Section - fondo negro */}
        <section
          className={`relative left-1/2 right-1/2 -mx-[50vw] grid w-screen items-start justify-items-center overflow-hidden z-0 bg-black ${
            expanded ? "pointer-events-none" : ""
          }`}
          style={domeStyle}
        >
          <div className="reveal h-full w-full" data-animate="reveal">
            <AppDome />
          </div>
        </section>

        {/* Curved transition - media luna blanca */}
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-black">
          <div 
            className="h-24 w-full bg-white"
            style={{
              borderTopLeftRadius: "50% 100%",
              borderTopRightRadius: "50% 100%",
            }}
          />
        </div>

        {/* Promotions Section */}
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
          <div className="mx-auto max-w-7xl px-6 py-24">
            {/* Section Header */}
            <div className="reveal space-y-4 text-center" data-animate="reveal">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                Ofertas Exclusivas
              </span>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Destinos <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Imperdibles</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Descubre nuestras promociones especiales y vive experiencias únicas en los mejores destinos del mundo.
              </p>
            </div>

            {promosError ? (
              <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center text-red-600">
                {promosError}
              </div>
            ) : null}

            {/* Promotions Grid */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {promotions.map((promo, index) => (
                <Link
                  key={promo.id}
                  href={promo.linkUrl || "/paquetes"}
                  className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-200/30 hover:ring-violet-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={promo.imageUrl}
                      alt={promo.altText || promo.title || "Promoción"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Priority Badge */}
                    {promo.orderIndex <= 3 && (
                      <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                        🔥 Top {promo.orderIndex}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-violet-700">
                      {promo.title || "Promoción Especial"}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                      {promo.subtitle || "Oferta exclusiva disponible por tiempo limitado."}
                    </p>
                    
                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        Ver detalles
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-all group-hover:bg-violet-600 group-hover:text-white">
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {!promotions.length && !promosError ? (
              <div className="mt-14 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
                  <svg className="h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  Próximamente más ofertas
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Estamos preparando promociones increíbles para ti.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 text-white">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="reveal text-center" data-animate="reveal">
              <h2 className="text-3xl font-bold md:text-4xl">
                ¿Por qué elegirnos?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                Más de 10 años creando experiencias inolvidables para viajeros como tú.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: "🌍", title: "Destinos Únicos", desc: "Acceso a los lugares más exclusivos del mundo" },
                { icon: "💎", title: "Calidad Premium", desc: "Solo trabajamos con los mejores proveedores" },
                { icon: "🛡️", title: "Viaje Seguro", desc: "Protección total en todas tus reservaciones" },
                { icon: "💬", title: "Soporte 24/7", desc: "Asistencia personalizada en todo momento" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="reveal group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-violet-400/30 hover:bg-white/10"
                  data-animate="reveal"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <div className="reveal" data-animate="reveal">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                ¿Listo para tu próxima aventura?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600">
                Crea una cuenta gratuita y comienza a explorar destinos increíbles con ofertas exclusivas.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/app/acceder"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
                >
                  Comenzar ahora
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/paquetes"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-8 py-3.5 font-semibold text-slate-700 transition-all hover:border-violet-300 hover:bg-violet-50"
                >
                  Ver todos los paquetes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-lg font-bold text-white">
                  M
                </div>
                <span className="text-lg font-bold text-slate-900">Meraki Travels</span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
                <Link href="/paquetes" className="hover:text-violet-600">Paquetes</Link>
                <Link href="/app/acceder" className="hover:text-violet-600">Mi cuenta</Link>
                <a href="#" className="hover:text-violet-600">Términos</a>
                <a href="#" className="hover:text-violet-600">Privacidad</a>
              </div>
              <p className="text-sm text-slate-500">
                © 2024 Meraki Travels. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
