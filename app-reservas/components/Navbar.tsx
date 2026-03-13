"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import { RiInstagramLine } from "react-icons/ri";
import { FaTiktok, FaBars, FaUserCircle } from "react-icons/fa";
import { SiFacebook } from "react-icons/si";
import { useSessionStore } from "@/lib/session-store";

//0d1117

const Navbar: React.FC = () => {
  const customer = useSessionStore((state) => state.customer);

  return (
    // Header ancho completo pero sin fondo; el rectángulo es el contenedor interno
    <header className="w-full bg-transparent">
      {/* Rectángulo centrado */}
      <div className="mx-auto my-2 max-w-6xl px-1">
        <div className="rounded-2xl bg-[#669094] text-white shadow-lg ring-1 ring-white/10 overflow-hidden">
          {/* Contenido del navbar */}
          <div className="px-4 py-3 flex flex-col">
            {/* Fila inferior: logo, navegación y acciones */}
            <div className="flex items-center justify-between">
              {/* LOGO (extremo izquierdo) */}
              <Link
                href="/"
                aria-label="Ir al inicio"
                className="flex items-center shrink-0"
              >
                <Image
                  src="/meraki.svg"
                  alt="Meraki"
                  width={152}
                  height={52}
                  priority
                  className="w-auto h-9 sm:h-10 md:h-12 lg:h-14"
                />
              </Link>

          

              {/* Acciones (redes, menú y usuario) */}
              <div className="flex items-center gap-2">
                <Link
                  href="https://www.facebook.com/share/1EU3TzVynM/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <SiFacebook size={16} />
                </Link>
                <Link
                  href="https://www.instagram.com/merakitravelsoficial?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <RiInstagramLine size={16} />
                </Link>
                <Link
                  href="https://www.tiktok.com/@merakitravels_?_r=1&_t=ZS-91Jo2LlT8bA"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  <FaTiktok size={16} />
                </Link>

                <span className="mx-1 hidden sm:inline-block h-5 w-px bg-white/10" />

                <button
                  type="button"
                  aria-label="Abrir menú"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition"
                  onClick={() => {}}
                >
                  <FaBars size={16} />
                </button>

                <Link
                  href="/app/perfil"
                  aria-label="Cuenta"
                  className="inline-flex h-9 items-center gap-2 rounded-full ring-1 ring-white/10 bg-white/5 px-3 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <FaUserCircle size={18} />
                  <span className="hidden text-xs sm:inline">
                    {customer ? customer.fullName : "Iniciar sesión"}
                  </span>
                </Link>
              </div>
            </div>
          </div>
          {/* /Contenido */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
