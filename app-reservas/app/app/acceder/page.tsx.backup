"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { http } from "@/lib/http";
import { useSessionStore } from "@/lib/session-store";
import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from "@/features/search/types";

export default function AccederPage() {
  const router = useRouter();
  const { customer, setSession, hydrated } = useSessionStore();
  const [step, setStep] = useState<"welcome" | "login" | "register">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

      // Redirect based on role
      if (response.customer.role === "ADMIN" || response.customer.role === "OPERATIONS") {
        router.push("/app/admin");
      } else {
        router.push("/app");
      }
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Por favor completa nombre, email y contraseña");
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
    } catch (err) {
      console.error(err);
      setError("No pudimos crear tu cuenta. Verifica que el email no esté registrado.");
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
      <main className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="animate-pulse text-zinc-400">Cargando...</div>
      </main>
    );
  }

  if (customer) {
    return null; // Will redirect
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-3xl shadow-lg shadow-violet-500/20">
            ✈️
          </div>
          <h1 className="text-2xl font-bold text-white">Meraki Travels</h1>
          <p className="mt-1 text-sm text-zinc-400">Tu próxima aventura comienza aquí</p>
        </div>

        {/* Card */}
        <div 
          className={`
            rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 
            p-8 shadow-2xl backdrop-blur-sm transition-all duration-500
            ${step === "login" ? "scale-100" : "scale-100"}
          `}
        >
          {step === "welcome" ? (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">¡Bienvenido!</h2>
                <p className="text-sm text-zinc-400">
                  Accede a tu cuenta o crea una nueva para gestionar tus viajes.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { resetForm(); setStep("login"); }}
                  className="
                    group relative w-full overflow-hidden rounded-2xl 
                    bg-gradient-to-r from-violet-600 to-purple-600 
                    px-6 py-4 font-semibold text-white 
                    shadow-lg shadow-violet-500/25 
                    transition-all duration-300 
                    hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Ya tengo cuenta
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                <button
                  type="button"
                  onClick={() => { resetForm(); setStep("register"); }}
                  className="
                    group relative w-full overflow-hidden rounded-2xl 
                    bg-gradient-to-r from-emerald-600 to-teal-600 
                    px-6 py-4 font-semibold text-white 
                    shadow-lg shadow-emerald-500/25 
                    transition-all duration-300 
                    hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Crear mi cuenta
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-transparent px-3 text-zinc-500">o</span>
                  </div>
                </div>

                <Link
                  href="/"
                  className="
                    block w-full rounded-2xl border border-white/10 
                    bg-white/5 px-6 py-4 font-medium text-zinc-300 
                    transition-all duration-300 
                    hover:border-white/20 hover:bg-white/10 hover:text-white
                  "
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explorar destinos primero
                  </span>
                </Link>
              </div>

              <p className="text-xs text-zinc-500">
                Al registrarte podrás guardar tus preferencias y hacer seguimiento de tus viajes.
              </p>
            </div>
          ) : step === "login" ? (
            <div className="space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep("welcome");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Iniciar sesión</h2>
                <p className="text-sm text-zinc-400">Ingresa tus credenciales para continuar</p>
              </div>

              {error && (
                <div className="animate-shake rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-4 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20
                      "
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Contraseña</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-12 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={loading}
                className="
                  group relative w-full overflow-hidden rounded-xl 
                  bg-gradient-to-r from-violet-600 to-purple-600 
                  px-6 py-3.5 font-semibold text-white 
                  shadow-lg shadow-violet-500/25 
                  transition-all duration-300 
                  hover:shadow-xl hover:shadow-violet-500/30
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  <span className="relative z-10">Iniciar sesión</span>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <p className="text-center text-xs text-zinc-500">
                Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          ) : (
            /* step === "register" */
            <div className="space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep("welcome");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Crear cuenta</h2>
                <p className="text-sm text-zinc-400">Únete y comienza a planear tu próxima aventura</p>
              </div>

              {error && (
                <div className="animate-shake rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Nombre completo</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre completo"
                      autoComplete="name"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-4 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                      "
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      autoComplete="email"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-4 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                      "
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono (opcional)</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      autoComplete="tel"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-4 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                      "
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Contraseña</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className="
                        w-full rounded-xl border border-white/10 bg-black/30 
                        py-3 pl-12 pr-12 text-white placeholder-zinc-500 
                        outline-none transition-all duration-200
                        focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">Usa al menos 8 caracteres con letras y números</p>
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleRegister()}
                disabled={loading}
                className="
                  group relative w-full overflow-hidden rounded-xl 
                  bg-gradient-to-r from-emerald-600 to-teal-600 
                  px-6 py-3.5 font-semibold text-white 
                  shadow-lg shadow-emerald-500/25 
                  transition-all duration-300 
                  hover:shadow-xl hover:shadow-emerald-500/30
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Crear mi cuenta
                  </span>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <p className="text-center text-xs text-zinc-500">
                Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { resetForm(); setStep("login"); }}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>© 2025 Meraki Travels. Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}
