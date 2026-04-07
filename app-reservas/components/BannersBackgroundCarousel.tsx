"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import merakiImageLoader from "@/lib/image-loader";

/**
 * Componente de carrusel para banners publicitarios.
 * Optimizado con Next Image y soporte WebP.
 */
type Slide = { src: string; alt?: string | null };
type BannerItem = {
  imageUrl?: string | null;
  image_url?: string | null;
  altText?: string | null;
  alt_text?: string | null;
  title?: string | null;
};

type Transition = "fade" | "slide" | "zoom";

type Props = {
  intervalMs?: number;
  transition?: Transition;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  priority?: boolean;
};

export default function BannersBackgroundCarousel({
  intervalMs = 4500,
  transition = "fade",
  className = "h-[100svh] w-screen",
  showArrows = true,
  showDots = true,
  priority = true, // Los banners suelen ser LCP, por defecto true
}: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);

  // Carga de banners desde la API interna
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/banners?active=true`, { cache: "no-store" });
        const data = (await res.json()) as BannerItem[] | unknown;

        if (cancelled) return;

        let imgs: Slide[] = (Array.isArray(data) ? data : [])
          .map((b) => ({
            src: (b.imageUrl ?? b.image_url ?? "").toString(),
            alt: b.altText ?? b.alt_text ?? b.title ?? null,
          }))
          .filter((s) => s.src && s.src.trim().length > 0);

        // Fallback images if API is empty
        if (imgs.length === 0) {
          imgs = [
            {
              src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000",
              alt: "Playa paradisíaca al atardecer",
            },
            {
              src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000",
              alt: "Montañas majestuosas bajo el sol",
            },
            {
              src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=2000",
              alt: "Arquitectura moderna en Dubái",
            },
            {
              src: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=2000",
              alt: "Santorini, Grecia",
            },
          ];
        }

        setSlides(imgs);
        setIdx(0);
      } catch (e) {
        console.error("Error cargando banners:", e);
        // Set fallbacks on error too
        setSlides([
          {
            src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000",
            alt: "Playa paradisíaca al atardecer",
          },
          {
            src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000",
          },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Intervalo de rotación
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides, intervalMs]);

  const onPrev = () => setIdx((p) => (p - 1 + slides.length) % slides.length);
  const onNext = () => setIdx((p) => (p + 1) % slides.length);

  const variants = useMemo(() => {
    switch (transition) {
      case "slide":
        return {
          enter: { x: "100%", opacity: 0 },
          center: { x: 0, opacity: 1 },
          exit: { x: "-100%", opacity: 0 },
        };
      case "zoom":
        return {
          enter: { scale: 1.1, opacity: 0 },
          center: { scale: 1, opacity: 1 },
          exit: { scale: 0.95, opacity: 0 },
        };
      default:
        return {
          enter: { opacity: 0 },
          center: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  }, [transition]);

  if (slides.length === 0) {
    return (
      <div className={`relative overflow-hidden ${className} bg-zinc-900 grid place-items-center`}>
        <span className="text-zinc-400 text-sm">Sin banners</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={idx}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative h-full w-full"
          >
            <Image
              loader={merakiImageLoader}
              src={slides[idx].src}
              alt={slides[idx].alt ?? "Banner publicitario"}
              fill
              priority={priority && idx === 0}
              quality={90}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none" />

      {showArrows && slides.length > 1 && (
        <div className="flex justify-between absolute w-full top-1/2 -translate-y-1/2 px-4 z-10">
          <button
            onClick={onPrev}
            className="rounded-full bg-black/40 hover:bg-black/60 p-3 text-white backdrop-blur-sm transition-colors"
          >
            ‹
          </button>
          <button
            onClick={onNext}
            className="rounded-full bg-black/40 hover:bg-black/60 p-3 text-white backdrop-blur-sm transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === idx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
