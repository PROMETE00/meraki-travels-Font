 "use client";

import { useEffect } from "react";
import Link from "next/link";

const PACKAGES = [
  {
    name: "Paquete Relax",
    price: "$189",
    duration: "3 noches",
    rating: 4.9,
    highlights: ["Spa premium", "Desayuno incluido", "Late checkout"]
  },
  {
    name: "Paquete Aventura",
    price: "$215",
    duration: "4 noches",
    rating: 4.7,
    highlights: ["Tours guiados", "Equipo incluido", "Seguro total"]
  },
  {
    name: "Paquete Romance",
    price: "$240",
    duration: "2 noches",
    rating: 4.8,
    highlights: ["Cena privada", "Habitacion deluxe", "Detalles sorpresa"]
  }
];

export default function PackagesPage() {
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-20">
        <div className="reveal space-y-4" data-animate="reveal">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">
            Paquetes recomendados
          </p>
          <h1 className="text-4xl font-semibold md:text-5xl">
            Vende experiencias completas, no solo noches
          </h1>
          <p className="max-w-2xl text-base text-slate-300 md:text-lg">
            Agrupa hospedaje, actividades y beneficios exclusivos para aumentar
            el valor percibido. Cada paquete esta listo para promocionarse en
            la pagina principal.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400">
              Crear paquete
            </button>
            <button className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:border-teal-300 hover:text-teal-200">
              Publicar en home
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className="reveal rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur"
              data-animate="reveal"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                <span>{pkg.duration}</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                  ★ {pkg.rating}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{pkg.name}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Paquete curado con beneficios clave y alta conversion.
              </p>
              <p className="mt-4 text-xl font-semibold text-teal-300">{pkg.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {pkg.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-3">
                <button className="flex-1 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400">
                  Vender paquete
                </button>
                <button className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal-300 hover:text-teal-200">
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="reveal grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur md:grid-cols-[1.2fr_1fr]" data-animate="reveal">
          <div>
            <h3 className="text-2xl font-semibold text-white">
              Que puedes agregar a los paquetes
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Combina servicios y beneficios para aumentar el ticket promedio.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <span>Traslados aeropuerto</span>
                <span className="font-semibold text-teal-300">+ $24</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <span>Cena privada</span>
                <span className="font-semibold text-teal-300">+ $35</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <span>Tour exclusivo</span>
                <span className="font-semibold text-teal-300">+ $42</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-white/70">Conversion estimada</p>
              <p className="mt-2 text-3xl font-semibold text-white">+28%</p>
              <p className="mt-2 text-sm text-slate-300">
                Paquetes con extras convierten mejor y reducen comparaciones.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-white/90"
            >
              Volver a home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
