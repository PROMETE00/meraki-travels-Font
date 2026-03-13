"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminCustomerItem, AdminCustomerOverviewResponse, AuthRegisterRequest } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export default function AdminClientesPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminCustomerItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [overview, setOverview] = useState<AdminCustomerOverviewResponse | null>(null);
  const [roleDraft, setRoleDraft] = useState<"CUSTOMER" | "ADMIN" | "OPERATIONS">("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "ADMIN" | "OPERATIONS",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!token || !isAdmin) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const suffix = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
      const response = await http<AdminCustomerItem[]>(`/api/admin/customers${suffix}`, {
        headers: buildAuthHeaders(token),
      });
      setItems(response);
      setSelectedId((current) => {
        if (response.length === 0) {
          setOverview(null);
          return null;
        }
        if (current && response.some((item) => item.id === current)) {
          return current;
        }
        return response[0].id;
      });
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para administrar clientes.");
      } else {
        setError("No pudimos cargar los clientes administrativos.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, logout, query, token]);

  const loadOverview = useCallback(
    async (customerId: number) => {
      if (!token || !isAdmin) {
        return;
      }

      try {
        setDetailLoading(true);
        setError(null);
        const response = await http<AdminCustomerOverviewResponse>(`/api/admin/customers/${customerId}`, {
          headers: buildAuthHeaders(token),
        });
        setOverview(response);
        setRoleDraft(response.customer.role);
      } catch (detailError) {
        console.error(detailError);
        if (isHttpErrorStatus(detailError, 401)) {
          logout();
          setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
        } else {
          setError("No pudimos cargar el historial operativo del cliente.");
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [isAdmin, logout, token],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadCustomers();
  }, [hydrated, loadCustomers]);

  useEffect(() => {
    if (!selectedId) {
      setOverview(null);
      return;
    }
    void loadOverview(selectedId);
  }, [loadOverview, selectedId]);

  const selectedCustomer = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  async function updateRole() {
    if (!token || !selectedId) {
      return;
    }

    try {
      setSavingRole(true);
      setError(null);
      const updated = await http<AdminCustomerItem>(`/api/admin/customers/${selectedId}/role`, {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ role: roleDraft }),
      });
      setItems((current) => current.map((item) => (item.id === selectedId ? updated : item)));
      setOverview((current) => (current ? { ...current, customer: updated } : current));
    } catch (saveError) {
      console.error(saveError);
      if (isHttpErrorStatus(saveError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else {
        setError("No pudimos actualizar el rol del usuario.");
      }
    } finally {
      setSavingRole(false);
    }
  }

  async function handleCreateUser() {
    if (!token || !isAdmin) return;

    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password) {
      setCreateError("Por favor completa nombre, email y contraseña");
      return;
    }

    if (newUser.password.length < 8) {
      setCreateError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      setCreatingUser(true);
      setCreateError(null);

      const payload: AuthRegisterRequest = {
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim().toLowerCase(),
        phone: newUser.phone.trim() || undefined,
        password: newUser.password,
      };

      // Register the user
      await http<{ token: string; customer: AdminCustomerItem }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If role is not CUSTOMER, update it
      if (newUser.role !== "CUSTOMER") {
        // Get the new user from the list and update their role
        const updatedList = await http<AdminCustomerItem[]>(`/api/admin/customers?query=${encodeURIComponent(newUser.email)}`, {
          headers: buildAuthHeaders(token),
        });
        const newCustomer = updatedList.find(c => c.email.toLowerCase() === newUser.email.toLowerCase());
        if (newCustomer) {
          await http<AdminCustomerItem>(`/api/admin/customers/${newCustomer.id}/role`, {
            method: "PUT",
            headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
            body: JSON.stringify({ role: newUser.role }),
          });
        }
      }

      setCreateSuccess(true);
      setNewUser({ fullName: "", email: "", phone: "", password: "", role: "CUSTOMER" });
      
      // Reload customer list
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
        void loadCustomers();
      }, 1500);
    } catch (err) {
      console.error(err);
      if (isHttpErrorStatus(err, 409)) {
        setCreateError("Ya existe un usuario con ese email.");
      } else {
        setCreateError("No pudimos crear el usuario. Intenta de nuevo.");
      }
    } finally {
      setCreatingUser(false);
    }
  }

  function resetCreateModal() {
    setShowCreateModal(false);
    setNewUser({ fullName: "", email: "", phone: "", password: "", role: "CUSTOMER" });
    setCreateError(null);
    setCreateSuccess(false);
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Clientes</h1>
          <p className="text-sm text-zinc-400">
            Busca usuarios, revisa su contexto operativo y administra roles desde soporte.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/app/admin" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={!isAdmin}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-violet-500/20 transition hover:shadow-violet-500/30 disabled:opacity-60"
          >
            + Crear usuario
          </button>
          <button
            type="button"
            onClick={() => void loadCustomers()}
            disabled={!isAdmin}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="grid gap-2 text-sm">
            <span>Buscar cliente</span>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="flex-1 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                placeholder="Nombre, email, teléfono o rol"
              />
              <button
                type="button"
                onClick={() => void loadCustomers()}
                disabled={!isAdmin}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-60"
              >
                Buscar
              </button>
            </div>
          </label>

          {loading ? <div className="text-sm text-zinc-300">Cargando clientes...</div> : null}
          {!loading && items.length === 0 ? <div className="text-sm text-zinc-400">No encontramos clientes con ese criterio.</div> : null}

          <div className="grid gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedId === item.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-black/20 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.fullName}</div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{item.role}</span>
                </div>
                <div className="mt-2 text-sm text-zinc-400">{item.email}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {item.phone || "Sin teléfono"} · {formatDate(item.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          {!hydrated ? <div className="text-sm text-zinc-300">Cargando sesión...</div> : null}
          {hydrated && !customer ? <div className="text-sm text-amber-100">Necesitas iniciar sesión.</div> : null}
          {hydrated && customer && !isAdmin ? <div className="text-sm text-red-100">Tu cuenta no tiene permisos para este panel.</div> : null}
          {hydrated && isAdmin && detailLoading ? <div className="text-sm text-zinc-300">Cargando overview del cliente...</div> : null}

          {hydrated && isAdmin && !selectedCustomer ? (
            <div className="text-sm text-zinc-400">Selecciona un cliente para ver su historial operativo.</div>
          ) : null}

          {overview ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <h2 className="text-xl font-semibold">{overview.customer.fullName}</h2>
                  <div className="mt-2 text-sm text-zinc-300">{overview.customer.email}</div>
                  <div className="mt-1 text-sm text-zinc-400">{overview.customer.phone || "Sin teléfono"}</div>
                  <div className="mt-1 text-xs text-zinc-500">Alta: {formatDate(overview.customer.createdAt)}</div>
                </div>

                <div className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-4">
                  <label className="grid gap-2 text-sm">
                    <span>Rol</span>
                    <select
                      value={roleDraft}
                      onChange={(event) => setRoleDraft(event.target.value as "CUSTOMER" | "ADMIN" | "OPERATIONS")}
                      className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="OPERATIONS">OPERATIONS</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void updateRole()}
                    disabled={savingRole || roleDraft === overview.customer.role}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-500 disabled:opacity-60"
                  >
                    {savingRole ? "Guardando..." : "Guardar rol"}
                  </button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Reservas" value={overview.metrics.totalBookings.toString()} detail={`${overview.metrics.confirmedBookings} confirmadas`} />
                <MetricCard label="Pagos" value={overview.metrics.totalPayments.toString()} detail={`${overview.metrics.succeededPayments} exitosos`} />
                <MetricCard label="Reembolsos" value={overview.metrics.refundedPayments.toString()} detail={`${overview.metrics.cancelledBookings} reservas canceladas`} />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Reservas</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{overview.metrics.pendingBookings} pendientes</span>
                  </div>
                  <div className="grid gap-3">
                    {overview.bookings.map((booking) => (
                      <article key={booking.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{booking.packageTitle}</div>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{booking.status}</span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {booking.originCode} → {booking.destinationCode} · {formatMoney(booking.totalPrice)}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{formatDate(booking.createdAt)}</div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pagos</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{overview.metrics.refundedPayments} reembolsados</span>
                  </div>
                  <div className="grid gap-3">
                    {overview.payments.map((payment) => (
                      <article key={payment.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{payment.packageTitle}</div>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{payment.status}</span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {payment.provider} · {formatMoney(payment.amount)} · {payment.currency}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{formatDate(payment.createdAt)}</div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </section>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div 
            className="relative w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={resetCreateModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {createSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">¡Usuario creado!</h3>
                <p className="mt-2 text-sm text-zinc-400">El nuevo usuario ya puede acceder al sistema.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-center text-xl font-semibold text-white">Crear nuevo usuario</h2>
                  <p className="mt-1 text-center text-sm text-zinc-400">Solo administradores pueden crear cuentas</p>
                </div>

                {createError && (
                  <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {createError}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Nombre completo *</span>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="Juan Pérez"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico *</span>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="juan@email.com"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono (opcional)</span>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Contraseña *</span>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">Rol del usuario</span>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "CUSTOMER" | "ADMIN" | "OPERATIONS" })}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    >
                      <option value="CUSTOMER">Cliente</option>
                      <option value="OPERATIONS">Operaciones</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={resetCreateModal}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateUser()}
                    disabled={creatingUser}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/30 disabled:opacity-60"
                  >
                    {creatingUser ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creando...
                      </span>
                    ) : (
                      "Crear usuario"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{detail}</div>
    </article>
  );
}
