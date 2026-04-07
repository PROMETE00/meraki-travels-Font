"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import { RiInstagramLine } from "react-icons/ri";
import { FaTiktok, FaBars, FaUserCircle } from "react-icons/fa";
import { SiFacebook } from "react-icons/si";
import { useSessionStore } from "@/lib/session-store";

const Navbar: React.FC = () => {
  const customer = useSessionStore((state) => state.customer);

  return (
    <header className="w-full bg-transparent">
      <div className="mx-auto my-2 max-w-6xl px-1">
        <div className="rounded-2xl bg-white/95 text-slate-700 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-xl overflow-hidden">
          <div className="px-4 py-3 flex flex-col">
            <div className="flex items-center justify-between">
              {/* LOGO */}
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

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Link
                  href="https://www.facebook.com/share/1EU3TzVynM/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-slate-200 bg-slate-50 text-slate-500 hover:text-teal-700 hover:bg-teal-50 hover:ring-teal-200 transition-all duration-300"
                >
                  <SiFacebook size={16} />
                </Link>
                <Link
                  href="https://www.instagram.com/merakitravelsoficial?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-slate-200 bg-slate-50 text-slate-500 hover:text-teal-700 hover:bg-teal-50 hover:ring-teal-200 transition-all duration-300"
                >
                  <RiInstagramLine size={16} />
                </Link>
                <Link
                  href="https://www.tiktok.com/@merakitravels_?_r=1&_t=ZS-91Jo2LlT8bA"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:ring-slate-300 transition-all duration-300"
                >
                  <FaTiktok size={16} />
                </Link>

                <span className="mx-1 hidden sm:inline-block h-5 w-px bg-slate-200" />

                <button
                  type="button"
                  aria-label="Abrir menú"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-300"
                  onClick={() => {}}
                >
                  <FaBars size={16} />
                </button>

                <Link
                  href="/app/profile"
                  aria-label="Cuenta"
                  className="inline-flex h-9 items-center gap-2 rounded-full ring-1 ring-teal-200 bg-teal-50 px-3 text-teal-700 transition-all duration-300 hover:bg-teal-100 hover:ring-teal-300 hover:shadow-md"
                >
                  <FaUserCircle size={18} />
                  <span className="hidden text-xs font-medium sm:inline">
                    {customer ? customer.fullName : "Iniciar sesión"}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
