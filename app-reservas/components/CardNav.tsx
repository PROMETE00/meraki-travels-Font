import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
// Icono para los enlaces de las tarjetas
import { GoArrowUpRight } from "react-icons/go";
// Icono de chevrón para abrir/cerrar el menú (sustituye al hamburguesa)
import { FiChevronDown } from "react-icons/fi";
// Hook global para gestionar resultados y estado de carga
import { http } from "@/lib/http";
import { useStore } from "@/lib/store";
import type { SearchResponse } from "@/features/search/types";

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

/**
 * CardNav genera una barra de navegación translúcida con tarjetas desplegables.
 * Incluye un campo de búsqueda integrado; al enviar la consulta, se llama a
 * `/api/search?q=<query>` y se actualizan los resultados a través del store.
 */
const CardNav: React.FC<CardNavProps> = ({
  items,
  className = "",
  ease = "power3.out",
  menuColor,
  buttonBgColor,
  buttonTextColor,
}) => {
  // Estado para la animación del menú
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Estado local del campo de búsqueda
  const [query, setQuery] = useState("");
  // Accedemos al store global para gestionar resultados y estado de carga
  const { setLoading, setResults, setSearchError } = useStore();

  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Calcula la altura del menú desplegado (sin cambios respecto al original)
  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";

        // Force reflow
        void contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        // Restore original styles
        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  // Envía la consulta del campo de búsqueda a la API y actualiza el store
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearchError(null);

    try {
      const data = await http<SearchResponse>(`/api/search?q=${encodeURIComponent(query.trim())}`);
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
      setResults([]);
      setSearchError("No pudimos consultar paquetes desde la búsqueda rápida.");
    } finally {
      setLoading(false);
    }
  };

  // Crea el timeline de animaciones (igual que el original)
  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, "-=0.1");

    return tl;
  }, [ease]);

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [createTimeline, items]);

  // Recalcula alturas al hacer resize
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [createTimeline, isExpanded]);

  // Alterna la expansión del menú y la rotación del chevrón
  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  // Guarda referencias a los contenedores de cada tarjeta para animarlos
  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99]  ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[60px] p-0 rounded-xl shadow-md relative overflow-hidden border border-white/10 bg-white/10 backdrop-blur-md will-change-[height]`}
      >
        <div className="px-1 mr-10 card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`mr-4 hamburger-menu group order-2 flex h-full cursor-pointer items-center justify-center transition-transform duration-300 md:order-none ${isHamburgerOpen ? "rotate-180" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#000" }}
          >
            <FiChevronDown size={24} aria-hidden="true" />
          </div>
          {/* Área de búsqueda integrada */}
          <div className="mb-2 flex w-full items-center gap-2 md:w-[730px]">
            <input
              type="text"
              className="text-center flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/15 placeholder-white/70 backdrop-blur-sm"
              placeholder="Busca tu proximo destino o ingresa tu presupuesto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleSearch()}
              className="rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              style={{ backgroundColor: buttonBgColor || "#111", color: buttonTextColor || "#fff" }}
            >
              Buscar
            </button>
          </div>
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? "visible pointer-events-auto" : "invisible pointer-events-none"
          } md:flex-row md:items-end md:gap-[12px]`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label font-normal tracking-[-0.5px] text-[18px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[15px] md:text-[16px]"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                  >
                    <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
