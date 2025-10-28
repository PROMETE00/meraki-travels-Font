"use client";
import { useState } from "react";
import CardNav from "@/components/CardNav"; // ajusta la ruta real
import SearchBarExpanded from "@/features/search/components/SearchBarExpanded";
import { useSearchClient } from "@/features/search/hooks/useSearchClient";
// import type { CardNavItem } from "@/components/ui/CardNav"; // opcional para tipar items

export default function SearchNav() {
  const [open, setOpen] = useState(false);
  const { runSearch } = useSearchClient();

  const logo = "/logo.svg";

  const items /* : CardNavItem[] */ = [
    {
      label: "Buscar",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Vuelos",   href: "#buscar", ariaLabel: "Buscar vuelos" },
        { label: "Hoteles",  href: "#buscar", ariaLabel: "Buscar hoteles" },
        { label: "Actividades", href: "#buscar", ariaLabel: "Buscar actividades" },
      ],
    },
    {
      label: "Destinos",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Oaxaca", href: "#destinos", ariaLabel: "Destino Oaxaca" },
        { label: "CDMX",   href: "#destinos", ariaLabel: "Destino CDMX" },
        { label: "Cancún", href: "#destinos", ariaLabel: "Destino Cancún" },
      ],
    },
    {
      label: "Ayuda",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Contacto",  href: "#ayuda", ariaLabel: "Ir a contacto" },
        { label: "Políticas", href: "#ayuda", ariaLabel: "Ver políticas" },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        // Evitar navegación real cuando se hace click en un <a>
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("a")) e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer select-none"
      >
        <CardNav
          logo={logo}
          logoAlt="Agencia"
          items={items}
          baseColor="#fff"
          menuColor="#000"
          buttonBgColor="#111"
          buttonTextColor="#fff"
          ease="power3.out"
        />
      </div>

      {open && <SearchBarExpanded onSubmit={runSearch} />}
    </div>
  );
}