"use client";

import { useState } from "react";
import CardNav from "@/components/CardNav";
import { useStore } from "@/lib/store";

export default function SearchNav() {
  const [query, setQuery] = useState("");
  const { setLoading, setResults, loading } = useStore();
  const handleNavClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest("a")) {
      e.preventDefault();
    }
  };

  const handleSearch = async () => {
    // Ignore empty queries; there's nothing to search for.
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const logo = "/logo.svg";

  const items = [
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div onClick={handleNavClick} className="cursor-pointer select-none">
        <CardNav
          items={items}
          baseColor="#fff"
          menuColor="#000"
          buttonBgColor="#111"
          buttonTextColor="#fff"
          ease="power3.out"
        />
      </div>
    </div>
  );
}