"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CardNav, { type CardNavItem } from "@/components/CardNav";

type Props = {
  onHeightChange?: (height: number) => void;
  topRem?: number; // separación respecto al Navbar (por defecto 0.75rem)
};

export default function SearchNav({ onHeightChange, topRem = 0.75 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<HTMLDivElement | null>(null);
  const [measuredH, setMeasuredH] = useState(0);

  const items: CardNavItem[] = [
    {
      label: "Buscar",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Vuelos", href: "#buscar", ariaLabel: "Buscar vuelos" },
        { label: "Hoteles", href: "#buscar", ariaLabel: "Buscar hoteles" },
        { label: "Actividades", href: "#buscar", ariaLabel: "Buscar actividades" },
      ],
    },
    {
      label: "Destinos",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Oaxaca", href: "#destinos", ariaLabel: "Destino Oaxaca" },
        { label: "CDMX", href: "#destinos", ariaLabel: "Destino CDMX" },
        { label: "Cancún", href: "#destinos", ariaLabel: "Destino Cancún" },
      ],
    },
    {
      label: "Ayuda",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Contacto", href: "#ayuda", ariaLabel: "Ir a contacto" },
        { label: "Políticas", href: "#ayuda", ariaLabel: "Ver políticas" },
      ],
    },
  ];

  // Medición robusta del bloque que contiene a CardNav
  useLayoutEffect(() => {
    const el = posRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h && h !== measuredH) {
        setMeasuredH(h);
        onHeightChange?.(h);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const t1 = setTimeout(measure, 180);
    const t2 = setTimeout(measure, 420);
    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (measuredH) onHeightChange?.(measuredH);
  }, [measuredH, onHeightChange]);

  const topPx = topRem * 16; // 1rem = 16px

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div ref={hostRef} className="relative">
        {/* Wrapper absoluto que posiciona el CardNav */}
        <div
          ref={posRef}
          className="absolute inset-x-0 z-50"
          style={{ top: `${topRem}rem` }}
          // Evita que el primer click se propague como "outside click" y cierre
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <CardNav
            items={items}
            baseColor="#fff"
            menuColor="#000"
            buttonBgColor="#111"
            buttonTextColor="#fff"
            ease="power3.out"
          />
        </div>

        {/* Spacer: mantiene el flujo y no tapa clics */}
        <div
          aria-hidden
          className="pointer-events-none"
          style={{ height: (measuredH || 64) + topPx }}
        />
      </div>
    </div>
  );
}