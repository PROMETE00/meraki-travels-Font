import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";
import { FiSearch, FiMapPin, FiDollarSign, FiCompass } from "react-icons/fi";
import Link from "next/link";

type SearchResult = {
  id: number;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  price: number;
  image?: string;
};

type DestinationResult = {
  id: number;
  name: string;
  image: string;
  link?: string;
};

type Suggestion = {
  label: string;
  value?: string;
  query?: string;
  icon: string;
};

type SuggestionsPayload = {
  destinations: DestinationResult[];
  budgets: Suggestion[];
  categories: Suggestion[];
};

export interface CardNavProps {
  className?: string;
  ease?: string;
}

/**
 * CardNav - Barra de búsqueda inteligente con hover/click toggle
 * Busca en tiempo real paquetes y destinos
 */
const CardNav: React.FC<CardNavProps> = ({
  className = "",
  ease = "power3.out",
}) => {
  const EMPTY_SUGGESTIONS: SuggestionsPayload = {
    destinations: [],
    budgets: [],
    categories: [],
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [destinations, setDestinations] = useState<DestinationResult[]>([]);
  const [searchType, setSearchType] = useState<string>("empty");
  const [suggestions, setSuggestions] = useState<SuggestionsPayload>(EMPTY_SUGGESTIONS);

  const navRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://merakitravelsbackend.prome.works";

  // Cargar sugerencias al montar
  useEffect(() => {
    fetch(`${API_URL}/api/search/suggestions`)
      .then((res) => (res.ok ? res.json() : EMPTY_SUGGESTIONS))
      .then((data) => {
        setSuggestions({
          destinations: Array.isArray(data?.destinations) ? data.destinations : [],
          budgets: Array.isArray(data?.budgets) ? data.budgets : [],
          categories: Array.isArray(data?.categories) ? data.categories : [],
        });
      })
      .catch(() => setSuggestions(EMPTY_SUGGESTIONS));
  }, [API_URL]);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setDestinations([]);
      setSearchType("empty");
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/search/quick?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.packages || []);
        setDestinations(data.destinations || []);
        setSearchType(data.type || "text");
      } catch {
        setResults([]);
        setDestinations([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, API_URL]);

  const calculateHeight = () => {
    if (contentRef.current) {
      return Math.min(contentRef.current.scrollHeight + 70, 450);
    }
    return 350;
  };

  const createTimeline = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 56, overflow: "hidden" });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.35,
      ease,
    });

    return tl;
  }, [ease]);

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [createTimeline]);

  // Actualizar timeline cuando cambia el contenido
  useEffect(() => {
    if (isExpanded && tlRef.current) {
      gsap.to(navRef.current, {
        height: calculateHeight(),
        duration: 0.25,
        ease,
      });
    }
  }, [results, destinations, suggestions, isExpanded, ease]);

  const openMenu = () => {
    const tl = tlRef.current;
    if (!tl || isExpanded) return;
    setIsExpanded(true);
    tl.play(0);
  };

  const closeMenu = () => {
    const tl = tlRef.current;
    if (!tl || !isExpanded || isPinned) return;
    tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
    tl.reverse();
  };

  const togglePin = () => {
    if (isPinned) {
      setIsPinned(false);
      closeMenu();
    } else {
      setIsPinned(true);
      openMenu();
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(openMenu, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(closeMenu, 300);
    }
  };

  const handleQuickSearch = (value: string) => {
    setQuery(value);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[750px] z-[99] ${className}`}>
      <nav
        ref={navRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`card-nav block h-[56px] rounded-2xl shadow-lg shadow-black/20 relative overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl will-change-[height] transition-shadow ${
          isExpanded ? "shadow-2xl shadow-black/30" : ""
        }`}
      >
        {/* Barra de búsqueda */}
        <div 
          className="absolute inset-x-0 top-0 h-[56px] flex items-center gap-3 px-4 z-[2] cursor-pointer"
          onClick={togglePin}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
            isPinned ? "bg-teal-500 text-white" : "bg-white/20 text-white"
          }`}>
            <FiSearch size={16} />
          </div>
          
          <input
            type="text"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/70"
            placeholder="Busca destinos, paquetes o ingresa tu presupuesto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              openMenu();
            }}
            onFocus={() => {
              setIsPinned(true);
              openMenu();
            }}
          />
          
          {isLoading && (
            <div className="w-5 h-5 border-2 border-white/30 border-t-teal-400 rounded-full animate-spin" />
          )}
          
          {query && !isLoading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
              }}
              className="text-white/70 hover:text-white text-sm px-2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contenido expandible */}
        <div
          ref={contentRef}
          className={`absolute left-0 right-0 top-[56px] p-4 bg-white/95 backdrop-blur-xl border-t border-white/20 ${
            isExpanded ? "visible" : "invisible"
          }`}
        >
          {/* Resultados de búsqueda */}
          {query && (results.length > 0 || destinations.length > 0) ? (
            <div className="space-y-4">
              {searchType === "budget" && (
                <p className="text-xs text-slate-500 px-1">
                  📊 Mostrando paquetes dentro de tu presupuesto
                </p>
              )}
              
              {/* Paquetes encontrados */}
              {results.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Paquetes
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.slice(0, 4).map((pkg) => (
                      <Link
                        key={pkg.id}
                        href={`/paquetes/${pkg.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 transition-all group"
                      >
                        {pkg.image ? (
                          <img
                            src={pkg.image}
                            alt={pkg.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                            <FiCompass className="text-teal-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-teal-700">
                            {pkg.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {pkg.origin} → {pkg.destination}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-teal-600">
                          {formatPrice(pkg.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Destinos encontrados */}
              {destinations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Destinos
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {destinations.map((dest) => (
                      <Link
                        key={dest.id}
                        href={dest.link || `/paquetes?destino=${dest.name}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 hover:bg-teal-100 hover:text-teal-700 transition-all text-sm text-slate-600"
                      >
                        <FiMapPin size={14} />
                        {dest.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : query && !isLoading ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No encontramos resultados para "{query}"</p>
              <p className="text-slate-400 text-xs mt-1">Intenta con otro término o presupuesto</p>
            </div>
          ) : (
            /* Sugerencias cuando no hay búsqueda */
            suggestions && (
              <div className="space-y-4">
                {/* Destinos populares */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                    <FiMapPin size={12} /> Destinos Populares
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(suggestions?.destinations ?? []).slice(0, 5).map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => handleQuickSearch(dest.name)}
                      >
                        {dest.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presupuestos sugeridos */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                    <FiDollarSign size={12} /> Por Presupuesto
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(suggestions?.budgets ?? []).map((budget, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(budget.value || "")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all text-sm"
                      >
                        <span>{budget.icon}</span>
                        {budget.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categorías */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                    <FiCompass size={12} /> Categorías
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(suggestions?.categories ?? []).map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(cat.query || "")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 transition-all text-sm"
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
