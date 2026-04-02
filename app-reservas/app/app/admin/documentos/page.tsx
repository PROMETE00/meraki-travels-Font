"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminCustomerItem,
  AdminImportantDocumentRequest,
  ImportantDocumentAuditEventItem,
  ImportantDocumentItem,
} from "@/features/search/types";
import { HttpError, http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

const typeOptions: ImportantDocumentItem["type"][] = [
  "PASSPORT",
  "VISA",
  "INSURANCE",
  "TICKET",
  "VOUCHER",
  "ITINERARY",
  "GUIDE",
  "FORM",
  "OTHER",
];

const categoryOptions: ImportantDocumentItem["category"][] = ["GENERAL", "BOOKING_SPECIFIC"];

const typeLabels: Record<ImportantDocumentItem["type"], string> = {
  PASSPORT: "Pasaporte",
  VISA: "Visa",
  INSURANCE: "Seguro",
  TICKET: "Boletos",
  VOUCHER: "Voucher",
  ITINERARY: "Itinerario",
  GUIDE: "Guía",
  FORM: "Formulario",
  OTHER: "Otro",
};

type DocumentFormState = {
  id: number | null;
  customerId: string;
  type: ImportantDocumentItem["type"];
  category: ImportantDocumentItem["category"];
  title: string;
  description: string;
  bookingId: string;
  fileName: string;
  documentUrl: string;
  active: boolean;
};

const emptyForm: DocumentFormState = {
  id: null,
  customerId: "",
  type: "OTHER",
  category: "GENERAL",
  title: "",
  description: "",
  bookingId: "",
  fileName: "",
  documentUrl: "",
  active: true,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function AdminDocumentosPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";

  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [documents, setDocuments] = useState<ImportantDocumentItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [auditDocumentId, setAuditDocumentId] = useState<number | null>(null);
  const [auditEvents, setAuditEvents] = useState<ImportantDocumentAuditEventItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function buildErrorMessage(loadError: unknown, fallback: string) {
    if (loadError instanceof HttpError) {
      return `${fallback} (${loadError.status}): ${loadError.message}`;
    }
    if (loadError instanceof Error && loadError.message) {
      return `${fallback}: ${loadError.message}`;
    }
    return fallback;
  }

  const loadData = useCallback(async () => {
    if (!token || !isAdmin) {
      setCustomers([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers = buildAuthHeaders(token);
      const [customersResponse, documentsResponse] = await Promise.allSettled([
        http<AdminCustomerItem[]>("/api/admin/customers", { headers }),
        http<ImportantDocumentItem[]>("/api/admin/documents", { headers }),
      ]);

      if (customersResponse.status === "fulfilled") {
        setCustomers(customersResponse.value);
        if (!selectedCustomerId && customersResponse.value.length > 0) {
          setSelectedCustomerId(String(customersResponse.value[0].id));
        }
      } else {
        throw customersResponse.reason;
      }

      if (documentsResponse.status === "fulfilled") {
        setDocuments(documentsResponse.value);
      } else {
        setDocuments([]);
        const message = buildErrorMessage(
          documentsResponse.reason,
          "No pudimos cargar los documentos importantes. Revisa que la migración de BD esté aplicada.",
        );
        setError(message);
      }
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para administrar documentos.");
      } else {
        setError(buildErrorMessage(loadError, "No pudimos cargar documentos/usuarios para administración."));
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, logout, selectedCustomerId, token]);

  useEffect(() => {
    if (!hydrated) return;
    void loadData();
  }, [hydrated, loadData]);

  const visibleDocuments = useMemo(() => {
    if (!selectedCustomerId) return documents;
    return documents.filter((item) => String(item.customerId) === selectedCustomerId);
  }, [documents, selectedCustomerId]);

  async function handleFileUpload(file: File) {
    if (!token) return;
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media/upload?scope=documents", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: formData,
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "No se pudo subir el documento.");
      }
      const payload = (await response.json()) as { url: string; name: string };
      setForm((current) => ({
        ...current,
        documentUrl: payload.url,
        fileName: payload.name,
      }));
      setMessage("Documento subido y listo para asignar.");
    } catch (uploadError) {
      console.error(uploadError);
      setError("No pudimos subir el documento. Usa PDF, DOC, DOCX o imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function submitDocument() {
    if (!token) return;
    if (!form.customerId || !form.title.trim() || !form.documentUrl.trim()) {
      setError("Selecciona un cliente y completa título + documento.");
      return;
    }

    const payload: AdminImportantDocumentRequest = {
      customerId: Number(form.customerId),
      type: form.type,
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      bookingId: form.bookingId ? Number(form.bookingId) : null,
      fileName: form.fileName.trim() || undefined,
      documentUrl: form.documentUrl.trim(),
      active: form.active,
    };

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const url = form.id ? `/api/admin/documents/${form.id}` : "/api/admin/documents";
      const method = form.id ? "PUT" : "POST";
      await http<ImportantDocumentItem>(url, {
        method,
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      setMessage(form.id ? "Documento actualizado." : "Documento asignado.");
      setForm({ ...emptyForm, customerId: selectedCustomerId || form.customerId });
      await loadData();
    } catch (saveError) {
      console.error(saveError);
      setError(buildErrorMessage(saveError, "No pudimos guardar el documento"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteDocument(id: number) {
    if (!token) return;
    const confirmed = window.confirm("¿Eliminar este documento?");
    if (!confirmed) return;
    try {
      setDeletingId(id);
      setError(null);
      setMessage(null);
      await http<void>(`/api/admin/documents/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Documento eliminado.");
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(buildErrorMessage(deleteError, "No pudimos eliminar el documento"));
    } finally {
      setDeletingId(null);
    }
  }

  async function loadAudit(documentId: number) {
    if (!token) return;
    try {
      setAuditLoading(true);
      setAuditDocumentId(documentId);
      setError(null);
      const response = await http<ImportantDocumentAuditEventItem[]>(`/api/admin/documents/${documentId}/audit`, {
        headers: buildAuthHeaders(token),
      });
      setAuditEvents(response);
    } catch (auditError) {
      console.error(auditError);
      setError(buildErrorMessage(auditError, "No pudimos cargar el historial del documento"));
    } finally {
      setAuditLoading(false);
    }
  }

  function editDocument(item: ImportantDocumentItem) {
    setForm({
      id: item.id,
      customerId: String(item.customerId),
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description ?? "",
      bookingId: item.bookingId ? String(item.bookingId) : "",
      fileName: item.fileName ?? "",
      documentUrl: item.documentUrl,
      active: item.active,
    });
    setSelectedCustomerId(String(item.customerId));
    void loadAudit(item.id);
  }

  if (!hydrated) {
    return <main className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando sesión...</main>;
  }

  if (!isAdmin) {
    return <main className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Solo administradores pueden asignar documentos.</main>;
  }

  return (
    <main className="app-page space-y-6 p-6">
      <header className="app-surface p-5">
        <h1 className="app-title">Admin · Documentos importantes</h1>
        <p className="app-subtitle mt-1">
          Asigna y cambia documentos por usuario específico para que el cliente los vea de forma dinámica.
        </p>
      </header>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="app-surface p-6 text-sm text-slate-500">Cargando documentos...</div> : null}

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="app-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Usuarios</h2>
          <select
            value={selectedCustomerId}
            onChange={(event) => {
              setSelectedCustomerId(event.target.value);
              setForm((current) => ({ ...current, customerId: event.target.value }));
            }}
            className="app-input w-full text-sm text-slate-800"
          >
            <option value="">Todos</option>
            {customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName} · {item.email}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            {customers.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(String(item.id));
                  setForm((current) => ({ ...current, customerId: String(item.id) }));
                }}
            className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  selectedCustomerId === String(item.id)
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                }`}
              >
                <div className="font-medium">{item.fullName}</div>
                <div className="text-xs text-slate-500">{item.email}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <section className="app-surface p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{form.id ? "Editar documento" : "Asignar documento"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>Cliente</span>
                <select
                  value={form.customerId}
                  onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}
                    className="app-input"
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fullName} · {item.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span>Título</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ej. Voucher hotel Cancún"
                   className="app-input"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span>Tipo</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ImportantDocumentItem["type"] }))}
                   className="app-input"
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {typeLabels[option]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span>Categoría</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value as ImportantDocumentItem["category"] }))
                  }
                   className="app-input"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "GENERAL" ? "General" : "Por reserva"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span>Reserva (opcional)</span>
                <input
                  value={form.bookingId}
                  onChange={(event) => setForm((current) => ({ ...current, bookingId: event.target.value }))}
                  placeholder="ID de reserva"
                   className="app-input"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span>Archivo</span>
                <input
                  value={form.fileName}
                  onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
                  placeholder="Nombre visible del archivo"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm">
              <span>Descripción</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm">
              <span>URL del documento</span>
              <input
                value={form.documentUrl}
                onChange={(event) => setForm((current) => ({ ...current, documentUrl: event.target.value }))}
                placeholder="/media/documents/archivo.pdf"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                {uploading ? "Subiendo..." : "Subir documento"}
                <input
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                />
                Activo para cliente
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void submitDocument()}
                disabled={saving}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
              >
                {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Asignar documento"}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...emptyForm, customerId: selectedCustomerId })}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Documentos asignados</h2>
            {visibleDocuments.length === 0 ? <div className="text-sm text-slate-500">No hay documentos para el filtro actual.</div> : null}
            <div className="grid gap-3">
              {visibleDocuments.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600">
                        {item.customerName} · {typeLabels[item.type]} · {item.category === "GENERAL" ? "General" : "Por reserva"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{item.description || "Sin descripción."}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.fileName || "Sin nombre de archivo"} · Actualizado {formatDate(item.updatedAt)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Asignado por {item.assignedByName || "N/D"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => editDocument(item)}
                      className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                    >
                      Editar / cambiar usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadAudit(item.id)}
                      className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      Ver historial
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDocument(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Historial de cambios</h2>
            {!auditDocumentId ? <div className="text-sm text-slate-500">Selecciona un documento y pulsa “Ver historial”.</div> : null}
            {auditLoading ? <div className="text-sm text-slate-500">Cargando historial...</div> : null}
            {auditDocumentId && !auditLoading && auditEvents.length === 0 ? (
              <div className="text-sm text-slate-500">No hay eventos registrados para este documento.</div>
            ) : null}
            <div className="grid gap-2">
              {auditEvents.map((event) => (
                <article key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-800">{event.summary}</div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{event.action}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {event.actorName} · {formatDate(event.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
