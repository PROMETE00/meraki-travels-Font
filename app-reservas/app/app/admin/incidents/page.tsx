"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminCustomerItem,
  AdminCustomerOverviewResponse,
  AdminIncidentTicketItem,
  IncidentTicketCommentItem,
} from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const statusOptions = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const statusLabels: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const statusStyles: Record<string, string> = {
  OPEN: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  IN_PROGRESS: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  RESOLVED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  CLOSED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-100",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-zinc-700/70 text-zinc-100",
  MEDIUM: "bg-sky-500/20 text-sky-100",
  HIGH: "bg-orange-500/20 text-orange-100",
  URGENT: "bg-rose-500/20 text-rose-100",
};

type DraftState = {
  status: string;
  priority: string;
  internalNote: string;
  resolutionNote: string;
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function AdminIncidenciasPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";

  const [tickets, setTickets] = useState<AdminIncidentTicketItem[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [customerOverview, setCustomerOverview] = useState<AdminCustomerOverviewResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    bookingId: "",
    title: "",
    description: "",
    priority: "MEDIUM" as (typeof priorityOptions)[number],
    internalNote: "",
  });
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});
  const [commentsByTicket, setCommentsByTicket] = useState<Record<number, IncidentTicketCommentItem[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loadingCommentsId, setLoadingCommentsId] = useState<number | null>(null);
  const [postingCommentId, setPostingCommentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!token || !isAdmin) return;
    const response = await http<AdminCustomerItem[]>("/api/admin/customers", {
      headers: buildAuthHeaders(token),
    });
    setCustomers(response);
  }, [isAdmin, token]);

  const loadTickets = useCallback(async () => {
    if (!token || !isAdmin) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (query.trim()) params.set("query", query.trim());
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await http<AdminIncidentTicketItem[]>(`/api/admin/tickets${suffix}`, {
        headers: buildAuthHeaders(token),
      });
      setTickets(response);
      setDrafts((current) => {
        const next = { ...current };
        response.forEach((ticket) => {
          next[ticket.id] = {
            status: next[ticket.id]?.status ?? ticket.status,
            priority: next[ticket.id]?.priority ?? ticket.priority,
            internalNote: next[ticket.id]?.internalNote ?? ticket.internalNote ?? "",
            resolutionNote: next[ticket.id]?.resolutionNote ?? ticket.resolutionNote ?? "",
          };
        });
        return next;
      });
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para administrar incidencias.");
      } else {
        setError("No pudimos cargar las incidencias operativas.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, logout, priorityFilter, query, statusFilter, token]);

  const loadCustomerOverview = useCallback(async (customerId: number) => {
    if (!token || !isAdmin) return;
    const response = await http<AdminCustomerOverviewResponse>(`/api/admin/customers/${customerId}`, {
      headers: buildAuthHeaders(token),
    });
    setCustomerOverview(response);
  }, [isAdmin, token]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      try {
        await Promise.all([loadCustomers(), loadTickets()]);
      } catch (loadError) {
        console.error(loadError);
      }
    })();
  }, [hydrated, loadCustomers, loadTickets]);

  useEffect(() => {
    if (!form.customerId) {
      setCustomerOverview(null);
      return;
    }
    void loadCustomerOverview(Number(form.customerId));
  }, [form.customerId, loadCustomerOverview]);

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tickets],
  );

  const metrics = useMemo(() => {
    const open = sortedTickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgress = sortedTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const unresolved = sortedTickets.filter((ticket) => ticket.status !== "RESOLVED" && ticket.status !== "CLOSED").length;
    const urgent = sortedTickets.filter((ticket) => ticket.priority === "URGENT" || ticket.priority === "HIGH").length;
    return { open, inProgress, unresolved, urgent };
  }, [sortedTickets]);

  async function createTicket() {
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      const created = await http<AdminIncidentTicketItem>("/api/admin/tickets", {
        method: "POST",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          customerId: Number(form.customerId),
          bookingId: form.bookingId ? Number(form.bookingId) : null,
          title: form.title,
          description: form.description,
          priority: form.priority,
          internalNote: form.internalNote,
        }),
      });
      setTickets((current) => [created, ...current]);
      setDrafts((current) => ({
        ...current,
        [created.id]: {
          status: created.status,
          priority: created.priority,
          internalNote: created.internalNote ?? "",
          resolutionNote: created.resolutionNote ?? "",
        },
      }));
      setForm({
        customerId: "",
        bookingId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        internalNote: "",
      });
      setCustomerOverview(null);
      setMessage("Incidencia creada y agregada al tablero.");
    } catch (submitError) {
      console.error(submitError);
      setError("No pudimos crear la incidencia.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveTicket(ticketId: number) {
    if (!token) return;
    const draft = drafts[ticketId];
    if (!draft) return;

    try {
      setSavingId(ticketId);
      setError(null);
      setMessage(null);
      const updated = await http<AdminIncidentTicketItem>(`/api/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(draft),
      });
      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDrafts((current) => ({
        ...current,
        [ticketId]: {
          status: updated.status,
          priority: updated.priority,
          internalNote: updated.internalNote ?? "",
          resolutionNote: updated.resolutionNote ?? "",
        },
      }));
      setMessage(`Incidencia #${ticketId} actualizada.`);
    } catch (saveError) {
      console.error(saveError);
      setError("No pudimos actualizar la incidencia.");
    } finally {
      setSavingId(null);
    }
  }

  async function loadComments(ticketId: number) {
    if (!token) return;

    try {
      setLoadingCommentsId(ticketId);
      setError(null);
      const response = await http<IncidentTicketCommentItem[]>(`/api/admin/tickets/${ticketId}/comments`, {
        headers: buildAuthHeaders(token),
      });
      setCommentsByTicket((current) => ({ ...current, [ticketId]: response }));
    } catch (loadError) {
      console.error(loadError);
      setError("No pudimos cargar la conversación de la incidencia.");
    } finally {
      setLoadingCommentsId(null);
    }
  }

  async function submitComment(ticketId: number) {
    if (!token) return;
    const draft = commentDrafts[ticketId] ?? "";
    const messageDraft = draft.trim();
    if (!messageDraft) return;

    try {
      setPostingCommentId(ticketId);
      setError(null);
      setMessage(null);
      const created = await http<IncidentTicketCommentItem>(`/api/admin/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ message: messageDraft }),
      });
      setCommentsByTicket((current) => ({
        ...current,
        [ticketId]: [...(current[ticketId] ?? []), created],
      }));
      setCommentDrafts((current) => ({ ...current, [ticketId]: "" }));
      await loadTickets();
      setMessage(`Comentario enviado en la incidencia #${ticketId}.`);
    } catch (submitError) {
      console.error(submitError);
      setError("No pudimos enviar el comentario.");
    } finally {
      setPostingCommentId(null);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copiado.`);
    } catch (copyError) {
      console.error(copyError);
      setError(`No pudimos copiar ${label.toLowerCase()}.`);
    }
  }

  return (
    <main className="app-page p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="app-title">Admin · Incidencias</h1>
          <p className="app-subtitle">Tablero operativo para tickets, seguimiento y conversación con clientes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadTickets()}
            disabled={!isAdmin}
            className="app-primary-button"
          >
            Actualizar
          </button>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={String(sortedTickets.length)} detail="tickets cargados" />
        <MetricCard label="Abiertas" value={String(metrics.open)} detail="requieren triage" accent={metrics.open > 0 ? "amber" : "neutral"} />
        <MetricCard label="En progreso" value={String(metrics.inProgress)} detail="seguimiento activo" accent={metrics.inProgress > 0 ? "cyan" : "neutral"} />
        <MetricCard label="Alta prioridad" value={String(metrics.urgent)} detail={`${metrics.unresolved} sin resolver`} accent={metrics.urgent > 0 ? "rose" : "neutral"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <h2 className="text-lg font-semibold">Nueva incidencia</h2>
            <p className="text-sm text-zinc-400">Crea un ticket y enlázalo al cliente o a una reserva cuando aplique.</p>
          </div>

          <label className="grid gap-2 text-sm">
            <span>Cliente</span>
            <select
              value={form.customerId}
              onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value, bookingId: "" }))}
              className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.email}
                </option>
              ))}
            </select>
          </label>

          {customerOverview ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm">
              <div className="font-medium text-cyan-100">Contexto del cliente</div>
              <div className="mt-2 text-zinc-200">{customerOverview.customer.fullName} · {customerOverview.customer.email}</div>
              <div className="mt-2 grid gap-2 text-xs text-zinc-300 md:grid-cols-2">
                <div>Reservas: {customerOverview.metrics.totalBookings}</div>
                <div>Pagos: {customerOverview.metrics.totalPayments}</div>
                <div>Confirmadas: {customerOverview.metrics.confirmedBookings}</div>
                <div>Reembolsadas: {customerOverview.metrics.refundedPayments}</div>
              </div>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span>Reserva vinculada</span>
            <select
              value={form.bookingId}
              onChange={(event) => setForm((current) => ({ ...current, bookingId: event.target.value }))}
              className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              disabled={!customerOverview}
            >
              <option value="">Sin reserva específica</option>
              {(customerOverview?.bookings ?? []).map((booking) => (
                <option key={booking.id} value={booking.id}>
                  #{booking.id} · {booking.packageTitle} · {booking.status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span>Título</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              placeholder="Resumen corto de la incidencia"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span>Descripción</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-28 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              placeholder="Detalle operativo"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span>Prioridad</span>
            <select
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as (typeof priorityOptions)[number] }))}
              className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {priorityLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span>Nota interna inicial</span>
            <textarea
              value={form.internalNote}
              onChange={(event) => setForm((current) => ({ ...current, internalNote: event.target.value }))}
              className="min-h-24 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              placeholder="Seguimiento interno"
            />
          </label>

          <button
            type="button"
            onClick={() => void createTicket()}
            disabled={submitting || !form.customerId || !form.title.trim() || !form.description.trim()}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-500 disabled:opacity-60"
          >
            {submitting ? "Creando..." : "Crear incidencia"}
          </button>
        </div>

        <div className="space-y-4">
          <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[220px_220px_1fr_auto] md:items-end">
            <label className="grid gap-2 text-sm">
              <span>Estado</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              >
                <option value="ALL">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>Prioridad</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
              >
                <option value="ALL">Todas</option>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {priorityLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>Buscar</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                placeholder="Cliente, email, título o nota"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadTickets()}
              disabled={!isAdmin}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-60"
            >
              Filtrar
            </button>
          </section>

          {loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando incidencias...</div> : null}
          {!loading && sortedTickets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
              No hay incidencias para los filtros actuales.
            </div>
          ) : null}

          <div className="grid gap-4">
            {sortedTickets.map((ticket) => {
              const commentDraft = commentDrafts[ticket.id] ?? "";
              const comments = commentsByTicket[ticket.id];
              return (
                <article key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3 xl:max-w-[40rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-zinc-300">Ticket #{ticket.id}</span>
                        <button type="button" onClick={() => void copyText(String(ticket.id), `Ticket #${ticket.id}`)} className="text-xs text-zinc-400 underline underline-offset-2 hover:text-white">
                          Copiar folio
                        </button>
                        <span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[ticket.status] ?? "border-white/10 bg-white/10 text-white"}`}>
                          {statusLabels[ticket.status] ?? ticket.status}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs ${priorityStyles[ticket.priority] ?? "bg-white/10 text-white"}`}>
                          {priorityLabels[ticket.priority] ?? ticket.priority}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold">{ticket.title}</h2>
                        <div className="mt-1 text-sm text-zinc-300">{ticket.customerName} · {ticket.customerEmail}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                        {ticket.description}
                      </div>

                      <div className="grid gap-2 text-xs text-zinc-500 md:grid-cols-2">
                        <div>Creada: {formatDate(ticket.createdAt)}</div>
                        <div>Actualizada: {formatDate(ticket.updatedAt)}</div>
                        {ticket.bookingId ? (
                          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                            <span>Reserva #{ticket.bookingId} · {ticket.packageTitle} · {ticket.bookingStatus}</span>
                            <button type="button" onClick={() => void copyText(String(ticket.bookingId), `Reserva #${ticket.bookingId}`)} className="underline underline-offset-2 hover:text-white">
                              Copiar referencia
                            </button>
                          </div>
                        ) : (
                          <div className="md:col-span-2">Sin reserva vinculada</div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 xl:min-w-[420px] xl:max-w-[420px]">
                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          value={drafts[ticket.id]?.status ?? ticket.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [ticket.id]: { ...current[ticket.id], status: event.target.value },
                            }))
                          }
                          className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {statusLabels[option]}
                            </option>
                          ))}
                        </select>
                        <select
                          value={drafts[ticket.id]?.priority ?? ticket.priority}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [ticket.id]: { ...current[ticket.id], priority: event.target.value },
                            }))
                          }
                          className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                        >
                          {priorityOptions.map((option) => (
                            <option key={option} value={option}>
                              {priorityLabels[option]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        value={drafts[ticket.id]?.internalNote ?? ticket.internalNote ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [ticket.id]: { ...current[ticket.id], internalNote: event.target.value },
                          }))
                        }
                        className="min-h-24 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                        placeholder="Nota interna"
                      />

                      <textarea
                        value={drafts[ticket.id]?.resolutionNote ?? ticket.resolutionNote ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [ticket.id]: { ...current[ticket.id], resolutionNote: event.target.value },
                          }))
                        }
                        className="min-h-24 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                        placeholder="Nota de resolución visible para el seguimiento"
                      />

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">Conversación</div>
                            <p className="text-xs text-zinc-400">Mensajes compartidos entre operaciones y cliente.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void loadComments(ticket.id)}
                            disabled={loadingCommentsId === ticket.id}
                            className="rounded-xl border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10 disabled:opacity-60"
                          >
                            {loadingCommentsId === ticket.id ? "Cargando..." : comments ? "Actualizar" : "Cargar"}
                          </button>
                        </div>

                        {comments?.length ? (
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <CommentBubble key={comment.id} comment={comment} />
                            ))}
                          </div>
                        ) : comments ? (
                          <div className="text-sm text-zinc-400">Aún no hay comentarios en este ticket.</div>
                        ) : (
                          <div className="text-sm text-zinc-500">Carga la conversación para revisar el hilo completo.</div>
                        )}

                        <div className="mt-3 grid gap-2">
                          <textarea
                            value={commentDraft}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [ticket.id]: event.target.value,
                              }))
                            }
                            maxLength={500}
                            className="min-h-24 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                            placeholder="Responder al cliente desde operaciones"
                          />
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Este mensaje será visible para el cliente.</span>
                            <span>{commentDraft.length}/500</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void submitComment(ticket.id)}
                            disabled={postingCommentId === ticket.id || !commentDraft.trim()}
                            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                          >
                            {postingCommentId === ticket.id ? "Enviando..." : "Enviar comentario"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ticket.bookingId ? (
                          <Link href="/app/admin/bookings" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
                            Ver reservas
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void saveTicket(ticket.id)}
                          disabled={savingId === ticket.id}
                          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-500 disabled:opacity-60"
                        >
                          {savingId === ticket.id ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "neutral" | "amber" | "cyan" | "rose";
}) {
  const accentStyles: Record<string, string> = {
    neutral: "border-white/10 bg-white/5",
    amber: "border-amber-400/30 bg-amber-500/10",
    cyan: "border-cyan-400/30 bg-cyan-500/10",
    rose: "border-rose-400/30 bg-rose-500/10",
  };

  return (
    <article className={`rounded-2xl border p-5 ${accentStyles[accent]}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{detail}</div>
    </article>
  );
}

function CommentBubble({ comment }: { comment: IncidentTicketCommentItem }) {
  const isAdmin = comment.actor === "ADMIN";
  return (
    <div className={`rounded-xl border p-3 ${isAdmin ? "border-cyan-400/20 bg-cyan-500/10" : "border-emerald-400/20 bg-emerald-500/10"}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <span className={`rounded-full px-2 py-1 ${isAdmin ? "bg-cyan-500/20 text-cyan-100" : "bg-emerald-500/20 text-emerald-100"}`}>
          {isAdmin ? "Operaciones" : "Cliente"}
        </span>
        <span>{comment.authorName}</span>
        <span className="text-zinc-500">{formatDate(comment.createdAt)}</span>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{comment.message}</div>
    </div>
  );
}
