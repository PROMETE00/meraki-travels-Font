"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type {
  CustomerSession,
  ProfileUpdateRequest,
  CustomerPreferencesResponse,
  CustomerPreferencesRequest,
} from "@/features/search/types";

type PreferencesForm = {
  favoriteDestinations: string;
  preferredAirlines: string;
  dietaryRestrictions: string;
  passportNumber: string;
  passportExpiry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialNeeds: string;
  notes: string;
};

const emptyPreferences: PreferencesForm = {
  favoriteDestinations: "",
  preferredAirlines: "",
  dietaryRestrictions: "",
  passportNumber: "",
  passportExpiry: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  specialNeeds: "",
  notes: "",
};

export default function PerfilPage() {
  const router = useRouter();
  const { customer, token, setCustomer, logout, hydrated } = useSessionStore();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
  });
  const [prefsForm, setPrefsForm] = useState<PreferencesForm>(emptyPreferences);
  const [loading, setLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !customer) {
      router.push("/app/acceder");
    }
  }, [hydrated, customer, router]);

  const loadPreferences = useCallback(async () => {
    if (!token) return;
    try {
      const prefs = await http<CustomerPreferencesResponse>("/api/customers/me/preferences", {
        headers: buildAuthHeaders(token),
      });
      setPrefsForm({
        favoriteDestinations: prefs.favoriteDestinations ?? "",
        preferredAirlines: prefs.preferredAirlines ?? "",
        dietaryRestrictions: prefs.dietaryRestrictions ?? "",
        passportNumber: prefs.passportNumber ?? "",
        passportExpiry: prefs.passportExpiry ?? "",
        emergencyContactName: prefs.emergencyContactName ?? "",
        emergencyContactPhone: prefs.emergencyContactPhone ?? "",
        specialNeeds: prefs.specialNeeds ?? "",
        notes: prefs.notes ?? "",
      });
    } catch (err) {
      console.error("Error cargando preferencias:", err);
    }
  }, [token]);

  useEffect(() => {
    if (customer) {
      setForm({
        email: customer.email,
        fullName: customer.fullName,
        phone: customer.phone ?? "",
      });
      void loadPreferences();
    }
  }, [customer, loadPreferences]);

  async function updateProfile() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload: ProfileUpdateRequest = {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      };

      const response = await http<CustomerSession>("/api/customers/me", {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      setCustomer(response);
      setMessage("Perfil actualizado correctamente.");
    } catch (profileError) {
      console.error(profileError);
      if (isHttpErrorStatus(profileError, 401)) {
        logout();
        router.push("/app/acceder");
      } else {
        setError("No pudimos actualizar tu perfil. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    if (!token) return;
    setPrefsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload: CustomerPreferencesRequest = {
        favoriteDestinations: prefsForm.favoriteDestinations.trim() || undefined,
        preferredAirlines: prefsForm.preferredAirlines.trim() || undefined,
        dietaryRestrictions: prefsForm.dietaryRestrictions.trim() || undefined,
        passportNumber: prefsForm.passportNumber.trim() || undefined,
        passportExpiry: prefsForm.passportExpiry.trim() || undefined,
        emergencyContactName: prefsForm.emergencyContactName.trim() || undefined,
        emergencyContactPhone: prefsForm.emergencyContactPhone.trim() || undefined,
        specialNeeds: prefsForm.specialNeeds.trim() || undefined,
        notes: prefsForm.notes.trim() || undefined,
      };

      await http<CustomerPreferencesResponse>("/api/customers/me/preferences", {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      setMessage("Preferencias guardadas correctamente.");
    } catch (err) {
      console.error(err);
      if (isHttpErrorStatus(err, 401)) {
        logout();
        router.push("/app/acceder");
      } else {
        setError("Error guardando preferencias.");
      }
    } finally {
      setPrefsLoading(false);
    }
  }

  if (!hydrated || !customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="animate-pulse text-zinc-400">Cargando perfil...</div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-sm text-zinc-400">
            Administra tu información personal y preferencias de viaje.
          </p>
        </div>

        <Link
          href="/app/reservas"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ver mis reservas
        </Link>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Profile Info */}
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        {/* Edit Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
              {customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Información personal</h2>
              <p className="text-sm text-zinc-400">Actualiza tus datos de contacto</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="tu@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Nombre completo</span>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Tu nombre"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="+52 55 1234 5678"
              />
            </label>

            <button
              type="button"
              onClick={() => void updateProfile()}
              disabled={loading}
              className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Session Info Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Sesión activa</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-zinc-400">Nombre</span>
              <span className="font-medium text-white">{customer.fullName}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-zinc-400">Email</span>
              <span className="font-medium text-white">{customer.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-zinc-400">Teléfono</span>
              <span className="font-medium text-white">{customer.phone || "No registrado"}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-zinc-400">Tipo de cuenta</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                customer.role === "ADMIN" 
                  ? "bg-violet-500/20 text-violet-300" 
                  : customer.role === "OPERATIONS"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {customer.role === "ADMIN" ? "Administrador" : customer.role === "OPERATIONS" ? "Operador" : "Cliente"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="text-zinc-400">ID de cliente</span>
              <span className="font-mono text-xs text-zinc-500">{customer.id}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Preferencias de viaje</h2>
          <p className="text-sm text-zinc-400">
            Guarda tu información para hacer tus reservaciones más rápidas y personalizadas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Destinos favoritos</span>
            <input
              type="text"
              value={prefsForm.favoriteDestinations}
              onChange={(e) => setPrefsForm((c) => ({ ...c, favoriteDestinations: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Cancún, Los Cabos, Europa..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Aerolíneas preferidas</span>
            <input
              type="text"
              value={prefsForm.preferredAirlines}
              onChange={(e) => setPrefsForm((c) => ({ ...c, preferredAirlines: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Volaris, Aeroméxico..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Restricciones alimenticias</span>
            <input
              type="text"
              value={prefsForm.dietaryRestrictions}
              onChange={(e) => setPrefsForm((c) => ({ ...c, dietaryRestrictions: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Vegetariano, sin gluten..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Necesidades especiales</span>
            <input
              type="text"
              value={prefsForm.specialNeeds}
              onChange={(e) => setPrefsForm((c) => ({ ...c, specialNeeds: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Silla de ruedas, asistencia..."
            />
          </label>
        </div>

        {/* Documents */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="mb-4 text-base font-medium text-white">Documentos de viaje</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Número de pasaporte</span>
              <input
                type="text"
                value={prefsForm.passportNumber}
                onChange={(e) => setPrefsForm((c) => ({ ...c, passportNumber: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="ABC123456"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Vigencia del pasaporte</span>
              <input
                type="date"
                value={prefsForm.passportExpiry}
                onChange={(e) => setPrefsForm((c) => ({ ...c, passportExpiry: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              />
            </label>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="mb-4 text-base font-medium text-white">Contacto de emergencia</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Nombre del contacto</span>
              <input
                type="text"
                value={prefsForm.emergencyContactName}
                onChange={(e) => setPrefsForm((c) => ({ ...c, emergencyContactName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Nombre completo"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono del contacto</span>
              <input
                type="tel"
                value={prefsForm.emergencyContactPhone}
                onChange={(e) => setPrefsForm((c) => ({ ...c, emergencyContactPhone: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="+52 55 1234 5678"
              />
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="mb-4 text-base font-medium text-white">Notas adicionales</h3>
          <textarea
            value={prefsForm.notes}
            onChange={(e) => setPrefsForm((c) => ({ ...c, notes: e.target.value }))}
            className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            placeholder="Cualquier información adicional que quieras guardar..."
          />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void savePreferences()}
            disabled={prefsLoading}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60"
          >
            {prefsLoading ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      </section>
    </main>
  );
}
