"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import merakiImageLoader from "@/lib/image-loader";
import type { ImageAsset } from "@/lib/nocodb";

/**
 * Componente de carrusel de fondo animado.
 * Utiliza next/image para optimización de carga y WebP.
 */
type Slide = { src: string; alt?: string | null };
type ImagesResponse = { images?: ImageAsset[] };

type Transition = "fade" | "slide" | "zoom";

type Props = {
  ownerTable: string;
  ownerId: number;
  intervalMs?: number;
  transition?: Transition;
  className?: string;             
  showArrows?: boolean;
  showDots?: boolean;
  limit?: number;
  priority?: boolean; // Prop para priorizar la carga (LCP)
};

export default function BackgroundCarousel({
  ownerTable,
  ownerId,
  intervalMs = 4500,
  transition = "fade",
  className = "h-[100svh] w-screen",
  showArrows = true,
  showDots = true,
  limit = 20,
  priority = false,
}: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);

  // Carga inicial de imágenes desde la API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/images/${encodeURIComponent(ownerTable)}/${ownerId}?limit=${limit}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as ImagesResponse;
        if (!cancelled && data.images) {
          const imgs: Slide[] = data.images.map((it) => ({
            src: it.path,
            alt: it.alt_text,
          }));
          setSlides(imgs);
          setIdx(0);
        }
      } catch (e) {
        console.error("Error cargando imágenes del carrusel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerTable, ownerId, limit]);

  // Manejo del intervalo automático de cambio de slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIdx((p) => (p + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [slides, intervalMs]);

  const onPrev = () => setIdx((p) => (p - 1 + slides.length) % slides.length);
  const onNext = () => setIdx((p) => (p + 1) % slides.length);

  // Variantes de animación según el tipo de transición
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
      default: // fade
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
        <span className="text-zinc-400 text-sm">Sin imágenes</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Slides optimizados con Next Image */}
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
              alt={slides[idx].alt ?? "Fondo de carrusel"}
              fill
              priority={priority && idx === 0}
              quality={85}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Navegación manual */}
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

      {/* Indicadores inferiores */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === idx ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
