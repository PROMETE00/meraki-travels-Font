"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [prefsForm, setPrefsForm] = useState<PreferencesForm>(emptyPreferences);
  const [loading, setLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !customer) {
      router.push("/app/login");
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
      setProfileImage(customer.profileImageUrl ?? null);
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
        profileImageUrl: profileImage || undefined,
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
        router.push("/app/login");
      } else {
        setError("No pudimos actualizar tu perfil. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida.");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        setError("Error al procesar la imagen.");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Error al subir la imagen.");
      setUploadingImage(false);
    }
  }

  function removeProfileImage() {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        router.push("/app/login");
      } else {
        setError("Error guardando preferencias.");
      }
    } finally {
      setPrefsLoading(false);
    }
  }

  if (!hydrated || !customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 p-6">
        <div className="flex items-center gap-3 text-teal-600">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-medium">Cargando perfil...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
            <p className="text-slate-600 mt-1">
              Administra tu información personal y preferencias de viaje
            </p>
          </div>

          <Link
            href="/app/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver mis reservas
          </Link>
        </div>

        {/* Messages */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card - Left */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Información Personal</h2>
            
            {/* Profile Image Section */}
            <div className="mb-8 flex flex-col items-center gap-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 p-6 sm:flex-row sm:items-start">
              <div className="relative">
                {profileImage ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                    <Image
                      src={profileImage}
                      alt="Foto de perfil"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-500 to-emerald-600 text-4xl font-bold text-white shadow-lg">
                    {customer.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                    <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-slate-900">{customer.fullName}</h3>
                <p className="text-sm text-slate-600 mb-4">{customer.email}</p>
                
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {uploadingImage ? "Subiendo..." : "Subir foto"}
                  </button>
                  
                  {profileImage && !uploadingImage && (
                    <button
                      type="button"
                      onClick={removeProfileImage}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG o GIF. Máximo 5MB.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre completo</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="tu@email.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Teléfono</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="+52 55 1234 5678"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void updateProfile()}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>

          {/* Account Info Card - Right */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Información de cuenta</h2>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Tipo de cuenta</div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  customer.role === "ADMIN" 
                    ? "bg-violet-100 text-violet-700 border border-violet-200" 
                    : customer.role === "OPERATIONS"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}>
                  {customer.role === "ADMIN" ? "Administrador" : customer.role === "OPERATIONS" ? "Operador" : "Cliente"}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">ID de cliente</div>
                <div className="font-mono text-sm text-slate-700">#{customer.id}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">Miembro desde</div>
                <div className="text-sm text-slate-700">
                  {new Date(customer.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs font-semibold">Cuenta verificada</div>
                </div>
                <div className="text-xs opacity-90">Tu cuenta está activa y verificada</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Preferencias de viaje</h2>
            <p className="text-slate-600 mt-1">
              Guarda tu información para hacer tus reservaciones más rápidas y personalizadas
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Destinos favoritos
              </span>
              <input
                type="text"
                value={prefsForm.favoriteDestinations}
                onChange={(e) => setPrefsForm((c) => ({ ...c, favoriteDestinations: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Cancún, Los Cabos, Europa..."
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Aerolíneas preferidas
              </span>
              <input
                type="text"
                value={prefsForm.preferredAirlines}
                onChange={(e) => setPrefsForm((c) => ({ ...c, preferredAirlines: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Volaris, Aeroméxico..."
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Restricciones alimenticias
              </span>
              <input
                type="text"
                value={prefsForm.dietaryRestrictions}
                onChange={(e) => setPrefsForm((c) => ({ ...c, dietaryRestrictions: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Vegetariano, sin gluten..."
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Necesidades especiales
              </span>
              <input
                type="text"
                value={prefsForm.specialNeeds}
                onChange={(e) => setPrefsForm((c) => ({ ...c, specialNeeds: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Silla de ruedas, asistencia..."
              />
            </label>
          </div>

          {/* Documents */}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentos de viaje
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Número de pasaporte</span>
                <input
                  type="text"
                  value={prefsForm.passportNumber}
                  onChange={(e) => setPrefsForm((c) => ({ ...c, passportNumber: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="ABC123456"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Vigencia del pasaporte</span>
                <input
                  type="date"
                  value={prefsForm.passportExpiry}
                  onChange={(e) => setPrefsForm((c) => ({ ...c, passportExpiry: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Contacto de emergencia
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre del contacto</span>
                <input
                  type="text"
                  value={prefsForm.emergencyContactName}
                  onChange={(e) => setPrefsForm((c) => ({ ...c, emergencyContactName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Nombre completo"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Teléfono del contacto</span>
                <input
                  type="tel"
                  value={prefsForm.emergencyContactPhone}
                  onChange={(e) => setPrefsForm((c) => ({ ...c, emergencyContactPhone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="+52 55 1234 5678"
                />
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notas adicionales
            </h3>
            <textarea
              value={prefsForm.notes}
              onChange={(e) => setPrefsForm((c) => ({ ...c, notes: e.target.value }))}
              className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder="Cualquier información adicional que quieras guardar..."
            />
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => void savePreferences()}
              disabled={prefsLoading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60 sm:w-auto"
            >
              {prefsLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar preferencias"
              )}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
