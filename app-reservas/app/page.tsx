"use client";

import React, { useEffect, useState } from "react";
import BackgroundCarousel from "@/components/BackgroundCarousel";
import BackgroundDots from "@/components/ui/BackgroundDots";
import Navbar from "@/components/Navbar";
import SearchNav from "@/components/ui/SearchNav";
import ResultsSection from "@/features/catalog/components/ResultsSection";
import MapView from "@/features/map/MapView";
import AppDome from "@/components/AppDome";

export default function Home() {
  const [navH, setNavH] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Histeresis: evita abrir/cerrar por variaciones pequeñas de altura
  useEffect(() => {
    if (navH > 170 && !expanded) setExpanded(true);
    if (navH < 130 && expanded) setExpanded(false);
  }, [navH, expanded]);

  const domeStyle: React.CSSProperties = expanded
    ? {
        marginTop: "0.5rem",
        height: "84svh",
        transition:
          "margin-top 380ms cubic-bezier(.22,.61,.36,1), height 380ms cubic-bezier(.22,.61,.36,1)",
        willChange: "margin-top,height",
      }
    : {
        marginTop: "clamp(-6rem, -9vh, -3rem)",
        height: "90svh",
        transition:
          "margin-top 380ms cubic-bezier(.22,.61,.36,1), height 380ms cubic-bezier(.22,.61,.36,1)",
        willChange: "margin-top,height",
      };

  return (
    <div className="relative">
      {/* Fondo: carrusel (debajo de todo) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <BackgroundCarousel
          ownerTable="product_package" // cámbialo si quieres filtrar por otro owner
          ownerId={1}
          intervalMs={5000}
          transition="fade"          // "fade" | "slide" | "zoom"
          className="h-[100svh] w-screen"
          showArrows
          showDots
        />
        {/* velo sutil para contraste del contenido */}
        <div className="absolute inset-0 bg-black/30" />
      </div>
      {/*<BackgroundDots />*/}

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-0 pb-12">
        <div className="mx-auto max-w-4xl px-9">
          <SearchNav topRem={0.75} onHeightChange={setNavH} />
        </div>

        <section
          className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen grid place-items-center z-0 ${
            expanded ? "pointer-events-none" : ""
          }`}
          style={domeStyle}
        >
          <AppDome />
        </section>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ResultsSection className="md:col-span-2" />
          <aside>
            <MapView />
          </aside>
        </div>
      </main>
    </div>
  );
}