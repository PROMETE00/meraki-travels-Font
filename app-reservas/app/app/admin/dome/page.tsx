"use client";

import { useCallback, useEffect, useState } from "react";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";
import type { AdminMediaFileItem } from "@/features/search/types";

type DomeImageItem = {
  id: number;
  destinationName: string;
  imageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  promoLabel: string | null;
  promoBadge: string | null;
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
  promoLabel: string;
  promoBadge: string;
  priority: string;
  isActive: boolean;
};

const emptyForm: DomeImageFormState = {
  id: null,
  destinationName: "",
  imageUrl: "",
  altText: "",
  linkUrl: "",
  promoLabel: "",
  promoBadge: "",
  priority: "0",
  isActive: true,
};

const MAX_UPLOAD_SIDE = 1600;
const JPEG_QUALITY = 0.85;

async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
      img.src = imageUrl;
    });

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestSide > MAX_UPLOAD_SIDE ? MAX_UPLOAD_SIDE / longestSide : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    ctx.drawImage(image, 0, 0, width, height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const outputQuality = outputType === "image/jpeg" ? JPEG_QUALITY : undefined;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((output) => resolve(output), outputType, outputQuality);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const optimizedName = `${file.name.replace(/\.[^/.]+$/, "")}.${outputType === "image/png" ? "png" : "jpg"}`;
    return new File([blob], optimizedName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function AdminDomePage() {
  const { customer, token, hydrated } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [images, setImages] = useState<DomeImageItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<AdminMediaFileItem[]>([]);
  const [form, setForm] = useState<DomeImageFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
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
      const headers = buildAuthHeaders(token);
      const [domeData, mediaData] = await Promise.all([
        http<DomeImageItem[]>("/api/admin/dome-images", { headers }),
        http<{ files: AdminMediaFileItem[] }>("/api/admin/media/files?scope=dome", { headers }),
      ]);
      setImages(domeData);
      setMediaFiles(mediaData.files);
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
      promoLabel: form.promoLabel.trim() || null,
      promoBadge: form.promoBadge.trim() || null,
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
      promoLabel: img.promoLabel || "",
      promoBadge: img.promoBadge || "",
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

  const uploadDomeImage = async (file: File) => {
    if (!token) return;

    try {
      setUploading(true);
      setError(null);
      setMessage(null);
      const optimizedFile = await optimizeImageForUpload(file);
      const formData = new FormData();
      formData.append("file", optimizedFile);

      const response = await fetch("/api/admin/media/upload?scope=dome", {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "No se pudo subir la imagen.");
      }

      const uploaded = (await response.json()) as { url: string };
      setForm((current) => ({ ...current, imageUrl: uploaded.url }));
      setMessage("Imagen subida correctamente y seleccionada en el formulario.");
      await loadImages();
    } catch (uploadError) {
      console.error("Error uploading dome image:", uploadError);
      setError("No pudimos subir la imagen del Dome. Usa JPG, PNG, WEBP o GIF.");
    } finally {
      setUploading(false);
    }
  };

  const deleteDomeMedia = async (file: AdminMediaFileItem) => {
    if (!token) return;

    try {
      setDeletingMedia(file.name);
      setError(null);
      setMessage(null);
      const response = await fetch(
        `/api/admin/media/files?scope=dome&filename=${encodeURIComponent(file.name)}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders(token),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "No se pudo eliminar la imagen.");
      }

      setForm((current) =>
        current.imageUrl === file.url ? { ...current, imageUrl: "" } : current,
      );
      setMessage("Imagen eliminada de la galería del Dome.");
      await loadImages();
    } catch (deleteError) {
      console.error("Error deleting dome media:", deleteError);
      setError("No pudimos eliminar la imagen seleccionada.");
    } finally {
      setDeletingMedia(null);
    }
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
    <div className="mx-auto max-w-6xl px-4 py-8 text-slate-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Promociones del Dome Gallery
        </h1>
        <p className="mt-2 text-slate-600">
          Crea promociones destacadas para la galería 3D: imagen, texto promocional, badge y enlace.
          Puedes subir nuevas imágenes o reutilizar archivos ya cargados.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadImages()}
            disabled={loading}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
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
          {form.id ? "Editar Promoción" : "Nueva Promoción"}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
          </div>

          <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                URL de Imagen *
              </label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              required
              placeholder="https://... o /media/dome/archivo.jpg"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <div className="mt-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                {uploading ? "Subiendo..." : "Subir imagen desde tu equipo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadDomeImage(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Texto Promocional
            </label>
            <input
              type="text"
              value={form.promoLabel}
              onChange={(e) => setForm({ ...form, promoLabel: e.target.value })}
              placeholder="Ej: Oferta de temporada"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Badge
            </label>
            <input
              type="text"
              value={form.promoBadge}
              onChange={(e) => setForm({ ...form, promoBadge: e.target.value })}
              placeholder="Ej: HOT, -30%, NUEVO"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Imágenes disponibles (reutilizar)
          </h3>
          {mediaFiles.length === 0 ? (
            <p className="text-sm text-slate-500">No hay imágenes subidas en `dome`.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaFiles.map((file) => {
                const selected = form.imageUrl === file.url;
                return (
                  <div
                    key={file.name}
                    className={`rounded-xl border p-2 ${selected ? "border-violet-500 bg-violet-50" : "border-slate-200"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, imageUrl: file.url }))}
                      className="w-full text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-28 w-full rounded-lg object-cover"
                      />
                      <p className="mt-2 truncate text-xs text-slate-600">{file.name}</p>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, imageUrl: file.url }))}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Usar
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteDomeMedia(file)}
                        disabled={deletingMedia === file.name}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingMedia === file.name ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            Promociones Configuradas ({images.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : images.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No hay promociones configuradas. Crea la primera arriba.
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
                  {(img.promoLabel || img.promoBadge) && (
                    <p className="mt-0.5 truncate text-xs text-violet-700">
                      {img.promoLabel || "Sin label"}
                      {img.promoBadge ? ` • ${img.promoBadge}` : ""}
                    </p>
                  )}
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
