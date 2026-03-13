"use client";

import { useCallback, useEffect, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

type DomeImageItem = {
  id: number;
  destinationName: string;
  imageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DomeImageFormState = {
  id: number | null;
  destinationName: string;
  imageUrl: string;
  altText: string;
  linkUrl: string;
  priority: string;
  isActive: boolean;
};

const emptyForm: DomeImageFormState = {
  id: null,
  destinationName: "",
  imageUrl: "",
  altText: "",
  linkUrl: "",
  priority: "0",
  isActive: true,
};

export default function AdminDomePage() {
  const { customer, token, hydrated } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [images, setImages] = useState<DomeImageItem[]>([]);
  const [form, setForm] = useState<DomeImageFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!token || !canOperate) {
      setImages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await http<DomeImageItem[]>("/api/admin/dome-images", {
        headers: buildAuthHeaders(token),
      });
      setImages(data);
    } catch (err) {
      console.error("Error loading dome images:", err);
      if (isHttpErrorStatus(err, 401) || isHttpErrorStatus(err, 403)) {
        setError("No tienes permiso para ver las imágenes del Dome.");
      } else {
        setError("Error al cargar imágenes del Dome.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, canOperate]);

  useEffect(() => {
    if (hydrated && canOperate) {
      void loadImages();
    } else if (hydrated) {
      setLoading(false);
    }
  }, [hydrated, canOperate, loadImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      destinationName: form.destinationName.trim(),
      imageUrl: form.imageUrl.trim(),
      altText: form.altText.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      priority: parseInt(form.priority, 10) || 0,
      isActive: form.isActive,
    };

    try {
      if (form.id) {
        await http(`/api/admin/dome-images/${form.id}`, {
          method: "PUT",
          headers: {
            ...buildAuthHeaders(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setMessage("Imagen actualizada correctamente.");
      } else {
        await http("/api/admin/dome-images", {
          method: "POST",
          headers: {
            ...buildAuthHeaders(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        setMessage("Imagen creada correctamente.");
      }
      setForm(emptyForm);
      await loadImages();
    } catch (err) {
      console.error("Error saving dome image:", err);
      setError("Error al guardar la imagen.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (img: DomeImageItem) => {
    setForm({
      id: img.id,
      destinationName: img.destinationName,
      imageUrl: img.imageUrl,
      altText: img.altText || "",
      linkUrl: img.linkUrl || "",
      priority: String(img.priority),
      isActive: img.isActive,
    });
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Eliminar esta imagen del Dome?")) return;

    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      await http(`/api/admin/dome-images/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Imagen eliminada correctamente.");
      await loadImages();
    } catch (err) {
      console.error("Error deleting dome image:", err);
      setError("Error al eliminar la imagen.");
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setError(null);
    setMessage(null);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!canOperate) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-700">Acceso Denegado</h2>
          <p className="mt-2 text-red-600">
            No tienes permiso para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Imágenes del Dome Gallery
        </h1>
        <p className="mt-2 text-slate-600">
          Administra los destinos destacados que aparecen en la galería 3D del inicio.
          Las imágenes se ordenan por prioridad (mayor = más importante).
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          {message}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {form.id ? "Editar Imagen" : "Nueva Imagen de Destino"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre del Destino *
            </label>
            <input
              type="text"
              value={form.destinationName}
              onChange={(e) =>
                setForm({ ...form, destinationName: e.target.value })
              }
              required
              placeholder="Ej: Cancún, París, Tokio"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL de Imagen *
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              required
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Texto Alternativo
            </label>
            <input
              type="text"
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              placeholder="Descripción para accesibilidad"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL de Enlace
            </label>
            <input
              type="text"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="/paquetes?destino=cancun"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Prioridad
            </label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">
              Mayor número = mayor prioridad en la galería
            </p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-violet-500/20" />
            </label>
            <span className="text-sm text-slate-700">
              {form.isActive ? "Activo (visible)" : "Inactivo (oculto)"}
            </span>
          </div>
        </div>

        {/* Preview */}
        {form.imageUrl && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Vista Previa:</p>
            <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt={form.altText || form.destinationName || "Preview"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet-600 px-5 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-300 px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Images List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Imágenes Configuradas ({images.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : images.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No hay imágenes configuradas. Crea la primera arriba.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {images.map((img) => (
              <div
                key={img.id}
                className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
              >
                <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.altText || img.destinationName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='64' fill='%23e2e8f0'%3E%3Crect width='96' height='64'/%3E%3C/svg%3E";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900">
                      {img.destinationName}
                    </h3>
                    {img.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    Prioridad: {img.priority}
                    {img.linkUrl && ` • ${img.linkUrl}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(img)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deletingId === img.id}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === img.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-800">💡 Consejos</h3>
        <ul className="mt-2 space-y-1 text-sm text-amber-700">
          <li>• Usa imágenes de alta calidad (mínimo 800x600 px)</li>
          <li>• Las imágenes con mayor prioridad aparecen más prominentes</li>
          <li>• Puedes desactivar temporalmente sin eliminar</li>
          <li>• URL de enlace: usa rutas relativas como <code className="rounded bg-amber-100 px-1">/paquetes?destino=cancun</code></li>
        </ul>
      </div>
    </div>
  );
}
