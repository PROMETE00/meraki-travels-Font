"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
};

export default function BannersBackgroundCarousel({
  intervalMs = 4500,
  transition = "fade",
  className = "h-[100svh] w-screen",
  showArrows = true,
  showDots = true,
}: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/banners?active=true`, { cache: "no-store" });
      const data = (await res.json()) as BannerItem[] | unknown;

      if (cancelled) return;

      // IMPORTANT: filter banners with empty imageUrl to avoid <img src="">
      const imgs: Slide[] = (Array.isArray(data) ? data : [])
        .map((b) => ({
          src: (b.imageUrl ?? b.image_url ?? "").toString(),
          alt: b.altText ?? b.alt_text ?? b.title ?? null,
        }))
        .filter((s) => s.src && s.src.trim().length > 0);

      setSlides(imgs);
      setIdx(0);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
          <motion.img
            key={idx}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            src={slides[idx].src}
            alt={slides[idx].alt ?? ""}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>

      <div className="bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-3 text-white backdrop-blur-sm"
          >
            ‹
          </button>
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-3 text-white backdrop-blur-sm"
          >
            ›
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
