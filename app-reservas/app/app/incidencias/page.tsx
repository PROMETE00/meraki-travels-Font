"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomerIncidentTicketItem, IncidentTicketCommentItem } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import { 
  FaPlus,
  FaExclamationCircle,
  FaClock,
  FaCheck,
  FaLock,
  FaComments,
  FaUser,
  FaCalendarAlt,
  FaPaperPlane,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";

const statusLabels: Record<string, string> = {
  ALL: "Todas",
  OPEN: "Abiertas",
  IN_PROGRESS: "En progreso", 
  RESOLVED: "Resueltas",
  CLOSED: "Cerradas",
};

const statusStyles: Record<string, string> = {
  OPEN: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  OPEN: <FaExclamationCircle className="h-4 w-4" />,
  IN_PROGRESS: <FaClock className="h-4 w-4" />,
  RESOLVED: <FaCheck className="h-4 w-4" />,
  CLOSED: <FaLock className="h-4 w-4" />,
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media", 
  HIGH: "Alta",
  URGENT: "Urgente",
};

const priorityStyles: Record<string, string> = {
  LOW: "text-green-600 bg-green-100",
  MEDIUM: "text-yellow-600 bg-yellow-100",
  HIGH: "text-orange-600 bg-orange-100", 
  URGENT: "text-red-600 bg-red-100",
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

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
    } catch (err) {
      console.error("Error loading tickets:", err);
      if (isHttpErrorStatus(err, 401)) {
        logout();
        return;
      }
      setError("Error al cargar las incidencias. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [customer, token, logout]);

  const createTicket = useCallback(async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      setError("El asunto y la descripción son requeridos");
      return;
    }

    setCreatingTicket(true);
    setError(null);

    try {
      await http("/api/tickets", {
        method: "POST",
        headers: buildAuthHeaders(token!),
        body: JSON.stringify(newTicket),
      });
      
      setMessage("Incidencia creada exitosamente");
      setNewTicket({ subject: "", description: "", priority: "MEDIUM" });
      setShowCreateForm(false);
      loadTickets();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError("Error al crear la incidencia. Inténtalo de nuevo.");
    } finally {
      setCreatingTicket(false);
    }
  }, [newTicket, token, loadTickets]);

  const loadComments = useCallback(async (ticketId: number) => {
    if (loadingCommentsId === ticketId) return;
    
    setLoadingCommentsId(ticketId);
    try {
      const response = await http<IncidentTicketCommentItem[]>(`/api/tickets/${ticketId}/comments`, {
        headers: buildAuthHeaders(token!),
      });
      setCommentsByTicket(prev => ({ ...prev, [ticketId]: response }));
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingCommentsId(null);
    }
  }, [token, loadingCommentsId]);

  const addComment = useCallback(async (ticketId: number) => {
    const comment = commentDrafts[ticketId]?.trim();
    if (!comment) return;

    setPostingCommentId(ticketId);
    try {
      await http(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: buildAuthHeaders(token!),
        body: JSON.stringify({ comment }),
      });
      
      setCommentDrafts(prev => ({ ...prev, [ticketId]: "" }));
      loadComments(ticketId);
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Error al agregar el comentario");
    } finally {
      setPostingCommentId(null);
    }
  }, [commentDrafts, token, loadComments]);

  useEffect(() => {
    if (hydrated) {
      loadTickets();
    }
  }, [hydrated, loadTickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === "ALL") return tickets;
    return tickets.filter(t => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const toggleTicketExpansion = (ticketId: number) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
      if (!commentsByTicket[ticketId]) {
        loadComments(ticketId);
      }
    }
    setExpandedTickets(newExpanded);
  };

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis incidencias</h1>
          <p className="text-slate-600">
            Reporta problemas, haz preguntas y da seguimiento a tus solicitudes.
          </p>
        </div>

        {/* Create New Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FaPlus className="h-4 w-4" />
            Nueva incidencia
          </button>

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Crear nueva incidencia</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Asunto *
              </label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Describe brevemente tu problema"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prioridad
              </label>
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Explica detalladamente el problema o tu solicitud"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={createTicket}
                disabled={creatingTicket}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                {creatingTicket ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FaPlus className="h-4 w-4" />
                )}
                {creatingTicket ? "Creando..." : "Crear incidencia"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-600">Cargando incidencias...</p>
          </div>
        </div>
      ) : null}

      {/* Not Logged In State */}
      {hydrated && !customer ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <FaUser className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-amber-800">Inicia sesión para ver tus incidencias</h3>
          <p className="mt-2 text-amber-700">
            Accede a tu cuenta para reportar problemas y dar seguimiento a tus solicitudes.
          </p>
          <Link
            href="/app/acceder"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700"
          >
            Iniciar sesión
          </Link>
        </div>
      ) : null}

      {/* Empty State */}
      {hydrated && customer && !loading && !filteredTickets.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
            <FaComments className="h-10 w-10 text-teal-600" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-slate-800">
            {statusFilter === "ALL" ? "No tienes incidencias" : `No tienes incidencias ${statusLabels[statusFilter].toLowerCase()}`}
          </h3>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            {statusFilter === "ALL" 
              ? "¿Tienes algún problema o pregunta? Crea una nueva incidencia y nuestro equipo te ayudará." 
              : `No hay incidencias con estado "${statusLabels[statusFilter].toLowerCase()}" en este momento.`
            }
          </p>
          <div className="mt-8">
            {statusFilter === "ALL" ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
              >
                <FaPlus className="h-5 w-5" />
                Crear primera incidencia
              </button>
            ) : (
              <button
                onClick={() => setStatusFilter("ALL")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Ver todas las incidencias
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Tickets List */}
      {hydrated && customer && !loading && filteredTickets.length > 0 ? (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isExpanded = expandedTickets.has(ticket.id);
            const comments = commentsByTicket[ticket.id] || [];
            
            return (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}>
                        {statusIcons[ticket.status]}
                        {statusLabels[ticket.status]}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityStyles[ticket.priority]}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTicketExpansion(ticket.id)}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                      <span>#{ticket.id}</span>
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Ticket Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{ticket.title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="h-4 w-4" />
                        {formatDate(ticket.createdAt)}
                      </div>
                      {ticket.updatedAt && (
                        <div>Actualizado: {formatDate(ticket.updatedAt)}</div>
                      )}
                    </div>
                    {isExpanded && (
                      <p className="mt-4 text-slate-700">{ticket.description}</p>
                    )}
                  </div>

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FaComments className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Comentarios ({comments.length})
                        </span>
                      </div>

                      {/* Comments List */}
                      {loadingCommentsId === ticket.id ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-slate-600">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                          Cargando comentarios...
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">
                                  {comment.actor === "CUSTOMER" ? "Tú" : "Soporte"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700">{comment.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      {ticket.status !== "CLOSED" && (
                        <div className="mt-4 flex gap-3">
                          <input
                            type="text"
                            value={commentDrafts[ticket.id] || ""}
                            onChange={(e) => setCommentDrafts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="Escribe un comentario..."
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => addComment(ticket.id)}
                            disabled={postingCommentId === ticket.id || !commentDrafts[ticket.id]?.trim()}
                            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                          >
                            {postingCommentId === ticket.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <FaPaperPlane className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}