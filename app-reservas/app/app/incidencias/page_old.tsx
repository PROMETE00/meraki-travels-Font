"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerIncidentTicketItem, IncidentTicketCommentItem } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

const statusLabels: Record<string, string> = {
  ALL: "Todas",
  OPEN: "Abiertas",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resueltas",
  CLOSED: "Cerradas",
};

const statusStyles: Record<string, string> = {
  OPEN: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  IN_PROGRESS: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
  RESOLVED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  CLOSED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-100",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function CustomerIncidenciasPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const [tickets, setTickets] = useState<CustomerIncidentTicketItem[]>([]);
  const [commentsByTicket, setCommentsByTicket] = useState<Record<number, IncidentTicketCommentItem[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED">("ALL");
  const [loading, setLoading] = useState(true);
  const [loadingCommentsId, setLoadingCommentsId] = useState<number | null>(null);
  const [postingCommentId, setPostingCommentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!customer || !token) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await http<CustomerIncidentTicketItem[]>("/api/tickets", {
        headers: buildAuthHeaders(token),
      });
      setTickets(response);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para consultar incidencias.");
      } else {
        setError("No pudimos cargar tus incidencias.");
      }
    } finally {
      setLoading(false);
    }
  }, [customer, logout, token]);

  useEffect(() => {
    if (!hydrated) return;
    void loadTickets();
  }, [hydrated, loadTickets]);

  const filteredTickets = useMemo(() => {
    const base = [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (statusFilter === "ALL") {
      return base;
    }
    return base.filter((ticket) => ticket.status === statusFilter);
  }, [statusFilter, tickets]);

  const metrics = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgress = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const resolved = tickets.filter((ticket) => ticket.status === "RESOLVED").length;
    const lastUpdated = tickets.length ? tickets.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt ?? null : null;
    return { open, inProgress, resolved, lastUpdated };
  }, [tickets]);

  async function loadComments(ticketId: number) {
    if (!token) return;

    try {
      setLoadingCommentsId(ticketId);
      setError(null);
      const response = await http<IncidentTicketCommentItem[]>(`/api/tickets/${ticketId}/comments`, {
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
      const created = await http<IncidentTicketCommentItem>(`/api/tickets/${ticketId}/comments`, {
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
      setMessage(`Tu comentario se agregó a la incidencia #${ticketId}.`);
    } catch (submitError) {
      console.error(submitError);
      if (isHttpErrorStatus(submitError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para responder la incidencia.");
      } else {
        setError("No pudimos enviar tu comentario.");
      }
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
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidencias</h1>
          <p className="text-sm text-zinc-400">Da seguimiento a tickets abiertos con operaciones y responde desde tu sesión.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/app/reservas" className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
            Ver reservas
          </Link>
          <button
            type="button"
            onClick={() => void loadTickets()}
            disabled={!customer}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {!hydrated ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando sesión...</div> : null}
      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          Necesitas iniciar sesión para revisar tus incidencias.
        </div>
      ) : null}
      {hydrated && customer && loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando incidencias...</div> : null}

      {hydrated && customer ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Abiertas" value={String(metrics.open)} detail="requieren atención" accent={metrics.open > 0 ? "amber" : "neutral"} />
            <MetricCard label="En progreso" value={String(metrics.inProgress)} detail="seguimiento activo" accent={metrics.inProgress > 0 ? "cyan" : "neutral"} />
            <MetricCard label="Resueltas" value={String(metrics.resolved)} detail="ya atendidas" accent={metrics.resolved > 0 ? "emerald" : "neutral"} />
            <MetricCard label="Último movimiento" value={metrics.lastUpdated ? formatDate(metrics.lastUpdated) : "Sin actividad"} detail={`${tickets.length} tickets totales`} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-cyan-500 text-white" : "border border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"}`}
                  >
                    {statusLabels[status]}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {hydrated && customer && !loading && !filteredTickets.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
          No hay incidencias para el filtro seleccionado. Cambia de estado o espera nuevos movimientos de soporte.
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredTickets.map((ticket) => {
          const comments = commentsByTicket[ticket.id];
          const commentDraft = commentDrafts[ticket.id] ?? "";
          return (
            <article key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3 xl:max-w-[38rem]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-zinc-300">Ticket #{ticket.id}</span>
                    <button type="button" onClick={() => void copyText(String(ticket.id), `Ticket #${ticket.id}`)} className="text-xs text-zinc-400 underline underline-offset-2 hover:text-white">
                      Copiar folio
                    </button>
                    <span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[ticket.status] ?? "border-white/10 bg-white/10 text-white"}`}>
                      {statusLabels[ticket.status] ?? ticket.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{priorityLabels[ticket.priority] ?? ticket.priority}</span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">{ticket.title}</h2>
                    <div className="mt-1 text-sm text-zinc-400">Creada {formatDate(ticket.createdAt)} · actualizada {formatDate(ticket.updatedAt)}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    {ticket.description}
                  </div>

                  <div className="grid gap-2 text-sm text-zinc-400">
                    {ticket.bookingId ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>Reserva #{ticket.bookingId} · {ticket.packageTitle} · {ticket.bookingStatus}</span>
                        <button type="button" onClick={() => void copyText(String(ticket.bookingId), `Reserva #${ticket.bookingId}`)} className="text-xs underline underline-offset-2 hover:text-white">
                          Copiar referencia
                        </button>
                      </div>
                    ) : (
                      <div>Sin reserva vinculada.</div>
                    )}
                  </div>

                  {ticket.resolutionNote ? (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                      Resolución actual: {ticket.resolutionNote}
                    </div>
                  ) : null}
                </div>

                <div className="xl:min-w-[440px] xl:max-w-[440px] rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Conversación</div>
                      <p className="text-xs text-zinc-400">Comparte más detalle con operaciones o revisa respuestas recientes.</p>
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
                    <div className="text-sm text-zinc-400">Todavía no hay comentarios en esta incidencia.</div>
                  ) : (
                    <div className="text-sm text-zinc-500">Carga la conversación para revisar el intercambio completo.</div>
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
                      placeholder="Escribe aquí tu mensaje para operaciones"
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Tu mensaje será visible para operaciones.</span>
                      <span>{commentDraft.length}/500</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void submitComment(ticket.id)}
                      disabled={postingCommentId === ticket.id || !commentDraft.trim()}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      {postingCommentId === ticket.id ? "Enviando..." : "Enviar comentario"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
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
  accent?: "neutral" | "amber" | "cyan" | "emerald";
}) {
  const styles: Record<string, string> = {
    neutral: "border-white/10 bg-white/5",
    amber: "border-amber-400/30 bg-amber-500/10",
    cyan: "border-cyan-400/30 bg-cyan-500/10",
    emerald: "border-emerald-400/30 bg-emerald-500/10",
  };

  return (
    <article className={`rounded-2xl border p-5 ${styles[accent]}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-3 text-xl font-bold">{value}</div>
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
          {isAdmin ? "Operaciones" : "Tú"}
        </span>
        <span>{comment.authorName}</span>
        <span className="text-zinc-500">{formatDate(comment.createdAt)}</span>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{comment.message}</div>
    </div>
  );
}
