"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { http } from "@/lib/http";
import { useSessionStore } from "@/lib/session-store";
import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from "@/features/search/types";

export default function AccederPage() {
  const router = useRouter();
  const { customer, setSession, hydrated } = useSessionStore();
  const [step, setStep] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (hydrated && customer) {
      router.push("/app");
    }
  }, [hydrated, customer, router]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: AuthLoginRequest = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await http<AuthResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSession(response.token, response.customer);
      router.push("/app");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: AuthRegisterRequest = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      };

      const response = await http<AuthResponse>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSession(response.token, response.customer);
      router.push("/app");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Error al crear cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (step === "login") void handleLogin();
      if (step === "register") void handleRegister();
    }
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setError(null);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="animate-pulse text-slate-400">Cargando...</div>
      </div>
    );
  }

  if (customer) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-100 grid place-items-center p-4">
      {/* Main Container - inspirado en kiosco */}
      <main className="w-full max-w-6xl min-h-[640px] bg-white border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
        
        {/* Left Panel - Form */}
        <section className="p-12 lg:p-16 flex flex-col justify-center" aria-label="Inicio de sesión">
          {/* Brand */}
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link
              href="/"
              aria-label="Ir al inicio"
              className="inline-flex items-center"
            >
              <Image
                src="/meraki.svg"
                alt="Meraki Travels"
                width={140}
                height={44}
                priority
                className="h-10 w-auto"
              />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Regresar al inicio
            </Link>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">
              {step === "login" ? "Bienvenido de vuelta" : "Únete a nosotros"}
            </h1>
            <p className="text-slate-600 font-medium text-sm max-w-md leading-relaxed">
              {step === "login" 
                ? "Accede a tu cuenta para gestionar tus viajes y descubrir nuevas aventuras."
                : "Crea tu cuenta y comienza a planificar tus próximas aventuras con nosotros."
              }
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5 max-w-md" onSubmit={(e) => e.preventDefault()}>
            {step === "register" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
              />
            </div>

            {step === "register" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  autoComplete="tel"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={step === "login" ? "current-password" : "new-password"}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-teal-400 focus:ring-3 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.05 7.05M9.878 9.878a3 3 0 00-.007 4.243m4.242-4.242L16.95 7.05M14.121 14.121l2.829 2.829m-2.829-2.829a3 3 0 01-4.242 0M12 9a3 3 0 00-3 3m6 0a3 3 0 00-3-3m0 6a3 3 0 003-3" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options row */}
            {step === "login" && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-600 font-medium">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-teal-500" 
                  />
                  <span>Recordarme</span>
                </label>
                <Link 
                  href="#" 
                  className="text-teal-600 font-bold hover:text-teal-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={step === "login" ? handleLogin : handleRegister}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-600 border border-teal-400/60 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                step === "login" ? "Iniciar sesión" : "Crear cuenta"
              )}
            </button>

            {/* Toggle Form */}
            <div className="text-center text-sm text-slate-600 pt-4">
              {step === "login" ? (
                <span>
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => { resetForm(); setStep("register"); }}
                    className="text-teal-600 font-bold hover:text-teal-700 transition-colors"
                  >
                    Crear una
                  </button>
                </span>
              ) : (
                <span>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => { resetForm(); setStep("login"); }}
                    className="text-teal-600 font-bold hover:text-teal-700 transition-colors"
                  >
                    Iniciar sesión
                  </button>
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 pt-6 font-medium">
              © {new Date().getFullYear()} Meraki Travels · Tu próxima aventura
            </div>
          </form>
        </section>

        {/* Right Panel - Visual */}
        <section className="hidden lg:flex relative bg-gradient-to-br from-teal-500/95 via-emerald-500/90 to-cyan-600/85 items-center justify-center p-8" aria-label="Panel visual">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>
          
          {/* Main Illustration */}
          <div className="relative w-full h-full max-w-lg bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-2xl shadow-black/20">
            <div className="w-full h-full bg-white/10 rounded-xl border border-white/30 flex items-center justify-center overflow-hidden">
              {/* Travel Image */}
              <img 
                src="/images/banners/login_bg.jpg"
                alt="Destinos de ensueño" 
                className="w-full h-full object-cover rounded-xl opacity-95 filter drop-shadow-2xl"
                onError={(e) => {
                  // Fallback to travel icon if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-white/80 text-center">
                        <svg class="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3z M9 9l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                        <h3 class="text-xl font-semibold mb-2">Tu próxima aventura</h3>
                        <p class="text-white/70 text-sm">Descubre destinos increíbles con Meraki Travels</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>

          {/* Floating Elements - nubes decorativas */}
          <div className="absolute top-8 left-8 w-16 h-8 bg-white/15 border border-white/20 rounded-full blur-[0.5px]"></div>
          <div className="absolute bottom-12 right-12 w-12 h-6 bg-white/10 border border-white/15 rounded-full blur-[0.5px]"></div>
          <div className="absolute top-1/3 right-8 w-8 h-8 bg-white/20 border border-white/25 rounded-full blur-[0.5px]"></div>
        </section>

      </main>
    </div>
  );
}
