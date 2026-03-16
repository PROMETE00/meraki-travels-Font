"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminBannerItem, AdminMediaFileItem, AdminTravelPackageItem } from "@/features/search/types";
import { http, HttpError, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

type PackageFormState = {
  id: number | null;
  title: string;
  description: string;
  originCode: string;
  destinationCode: string;
  basePrice: string;
  coverImageUrl: string;
  active: boolean;
};

type BannerFormState = {
  id: number | null;
  title: string;
  subtitle: string;
  altText: string;
  linkUrl: string;
  imageUrl: string;
  orderIndex: string;
  isActive: boolean;
};

const emptyPackageForm: PackageFormState = {
  id: null,
  title: "",
  description: "",
  originCode: "",
  destinationCode: "",
  basePrice: "",
  coverImageUrl: "",
  active: true,
};

const emptyBannerForm: BannerFormState = {
  id: null,
  title: "",
  subtitle: "",
  altText: "",
  linkUrl: "",
  imageUrl: "",
  orderIndex: "0",
  isActive: true,
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

export default function AdminCatalogoPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [packages, setPackages] = useState<AdminTravelPackageItem[]>([]);
  const [banners, setBanners] = useState<AdminBannerItem[]>([]);
  const [packageMedia, setPackageMedia] = useState<AdminMediaFileItem[]>([]);
  const [bannerMedia, setBannerMedia] = useState<AdminMediaFileItem[]>([]);
  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(emptyBannerForm);
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);
  const [uploadingScope, setUploadingScope] = useState<"packages" | "banners" | null>(null);
  const [deletingMediaKey, setDeletingMediaKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!token || !canOperate) {
      setPackages([]);
      setBanners([]);
      setPackageMedia([]);
      setBannerMedia([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers = buildAuthHeaders(token);
      const [packagesResponse, bannersResponse, packageMediaResponse, bannerMediaResponse] = await Promise.all([
        http<AdminTravelPackageItem[]>("/api/admin/packages", { headers }),
        http<AdminBannerItem[]>("/api/admin/banners", { headers }),
        http<{ files: AdminMediaFileItem[] }>("/api/admin/media/files?scope=packages", { headers }),
        http<{ files: AdminMediaFileItem[] }>("/api/admin/media/files?scope=banners", { headers }),
      ]);
      setPackages(packagesResponse);
      setBanners(bannersResponse);
      setPackageMedia(packageMediaResponse.files);
      setBannerMedia(bannerMediaResponse.files);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para administrar el catálogo.");
      } else {
        setError("No pudimos cargar el catálogo administrativo.");
      }
    } finally {
      setLoading(false);
    }
  }, [canOperate, logout, token]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadCatalog();
  }, [hydrated, loadCatalog]);

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [packages],
  );

  async function submitPackage() {
    if (!token) {
      return;
    }
    try {
      setSavingPackage(true);
      setError(null);
      setMessage(null);
      const payload = {
        title: packageForm.title.trim(),
        description: packageForm.description.trim(),
        originCode: packageForm.originCode.trim().toUpperCase(),
        destinationCode: packageForm.destinationCode.trim().toUpperCase(),
        basePrice: Number(packageForm.basePrice),
        coverImageUrl: packageForm.coverImageUrl.trim(),
        active: packageForm.active,
      };
      const method = packageForm.id ? "PUT" : "POST";
      const url = packageForm.id ? `/api/admin/packages/${packageForm.id}` : "/api/admin/packages";
      await http<AdminTravelPackageItem>(url, {
        method,
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      setMessage(packageForm.id ? "Paquete actualizado." : "Paquete creado.");
      setPackageForm(emptyPackageForm);
      await loadCatalog();
    } catch (saveError) {
      console.error(saveError);
      setError("No pudimos guardar el paquete.");
    } finally {
      setSavingPackage(false);
    }
  }

  async function submitBanner() {
    if (!token) {
      return;
    }
    try {
      setSavingBanner(true);
      setError(null);
      setMessage(null);
      const payload = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        altText: bannerForm.altText.trim(),
        linkUrl: bannerForm.linkUrl.trim(),
        imageUrl: bannerForm.imageUrl.trim(),
        orderIndex: Number(bannerForm.orderIndex),
        isActive: bannerForm.isActive,
      };
      const method = bannerForm.id ? "PUT" : "POST";
      const url = bannerForm.id ? `/api/admin/banners/${bannerForm.id}` : "/api/admin/banners";
      await http<AdminBannerItem>(url, {
        method,
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      setMessage(bannerForm.id ? "Banner actualizado." : "Banner creado.");
      setBannerForm(emptyBannerForm);
      await loadCatalog();
    } catch (saveError) {
      console.error(saveError);
      setError("No pudimos guardar el banner.");
    } finally {
      setSavingBanner(false);
    }
  }

  async function deleteBanner(id: number) {
    if (!token) {
      return;
    }
    const confirmDelete = window.confirm("¿Seguro que deseas eliminar esta promoción?");
    if (!confirmDelete) {
      return;
    }
    try {
      setDeletingBannerId(id);
      setError(null);
      setMessage(null);
      await http<void>(`/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Promoción eliminada.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setError("No pudimos eliminar la promoción.");
    } finally {
      setDeletingBannerId(null);
    }
  }

  async function swapBannerOrder(item: AdminBannerItem, direction: "up" | "down") {
    if (!token) {
      return;
    }
    const sorted = [...banners].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = sorted.findIndex((entry) => entry.id === item.id);
    if (index === -1) return;
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = sorted[neighborIndex];
    if (!neighbor) return;
    try {
      setSavingBanner(true);
      setError(null);
      setMessage(null);
      await Promise.all([
        http<AdminBannerItem>(`/api/admin/banners/${item.id}`, {
          method: "PUT",
          headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
          body: JSON.stringify({
            title: item.title ?? "",
            subtitle: item.subtitle ?? "",
            altText: item.altText ?? "",
            linkUrl: item.linkUrl ?? "",
            imageUrl: item.imageUrl,
            orderIndex: neighbor.orderIndex,
            isActive: item.isActive,
          }),
        }),
        http<AdminBannerItem>(`/api/admin/banners/${neighbor.id}`, {
          method: "PUT",
          headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
          body: JSON.stringify({
            title: neighbor.title ?? "",
            subtitle: neighbor.subtitle ?? "",
            altText: neighbor.altText ?? "",
            linkUrl: neighbor.linkUrl ?? "",
            imageUrl: neighbor.imageUrl,
            orderIndex: item.orderIndex,
            isActive: neighbor.isActive,
          }),
        }),
      ]);
      setMessage("Prioridad actualizada.");
      await loadCatalog();
    } catch (shiftError) {
      console.error(shiftError);
      setError("No pudimos actualizar la prioridad.");
    } finally {
      setSavingBanner(false);
    }
  }

  async function uploadMedia(scope: "packages" | "banners", file: File) {
    if (!token) {
      return;
    }

    try {
      setUploadingScope(scope);
      setError(null);
      setMessage(null);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/media/upload?scope=${scope}`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new HttpError(response.status, body || "No pudimos subir el archivo.", body);
      }

      const uploaded = (await response.json()) as AdminMediaFileItem;
      if (scope === "packages") {
        setPackageForm((current) => ({ ...current, coverImageUrl: uploaded.url }));
      } else {
        setBannerForm((current) => ({ ...current, imageUrl: uploaded.url }));
      }
      setMessage("Imagen subida. Ya quedó seleccionada en el formulario.");
      await loadCatalog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("No pudimos subir la imagen. Usa JPG, PNG, WEBP o GIF.");
    } finally {
      setUploadingScope(null);
    }
  }

  async function deleteMedia(scope: "packages" | "banners", file: AdminMediaFileItem) {
    if (!token) {
      return;
    }

    try {
      setDeletingMediaKey(file.name);
      setError(null);
      setMessage(null);
      const response = await fetch(`/api/admin/media/files?scope=${scope}&filename=${encodeURIComponent(file.name)}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new HttpError(response.status, body || "No pudimos borrar el archivo.", body);
      }

      setPackageForm((current) => (current.coverImageUrl === file.url ? { ...current, coverImageUrl: "" } : current));
      setBannerForm((current) => (current.imageUrl === file.url ? { ...current, imageUrl: "" } : current));
      setMessage("Archivo eliminado de la galería.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setError("No pudimos eliminar la imagen seleccionada.");
    } finally {
      setDeletingMediaKey(null);
    }
  }

  return (
    <main className="space-y-6 p-6 text-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Catálogo y media</h1>
          <p className="text-sm text-slate-600">
            Gestiona paquetes, banners y su galería interna sin capturar URLs manuales.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCatalog()}
            disabled={!canOperate}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {!hydrated ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando sesión...</div> : null}
      {hydrated && !customer ? <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">Necesitas iniciar sesión.</div> : null}
      {hydrated && customer && !canOperate ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">Tu cuenta no tiene permisos para gestionar catálogo.</div> : null}
      {hydrated && canOperate && loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando catálogo...</div> : null}

      {hydrated && canOperate ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Paquetes</h2>
              <button type="button" onClick={() => setPackageForm(emptyPackageForm)} className="text-sm text-zinc-300 underline">
                Nuevo
              </button>
            </div>

            <div className="grid gap-3">
              <input value={packageForm.title} onChange={(event) => setPackageForm((current) => ({ ...current, title: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Título" />
              <textarea value={packageForm.description} onChange={(event) => setPackageForm((current) => ({ ...current, description: event.target.value }))} className="min-h-28 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Descripción" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={packageForm.originCode} onChange={(event) => setPackageForm((current) => ({ ...current, originCode: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Origen" />
                <input value={packageForm.destinationCode} onChange={(event) => setPackageForm((current) => ({ ...current, destinationCode: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Destino" />
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <input value={packageForm.basePrice} onChange={(event) => setPackageForm((current) => ({ ...current, basePrice: event.target.value }))} type="number" min="0.01" step="0.01" className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Precio base" />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={packageForm.active} onChange={(event) => setPackageForm((current) => ({ ...current, active: event.target.checked }))} />
                  Activo
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Portada del paquete</div>
                    <p className="text-xs text-zinc-400">Puedes pegar una URL existente o subir una imagen a la galería de paquetes.</p>
                  </div>
                  <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10">
                    {uploadingScope === "packages" ? "Subiendo..." : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingScope !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) {
                          void uploadMedia("packages", file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  value={packageForm.coverImageUrl}
                  onChange={(event) => setPackageForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
                  className="mt-3 w-full rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                  placeholder="URL de portada"
                />
                {packageForm.coverImageUrl ? (
                  <img src={packageForm.coverImageUrl} alt="Vista previa de portada" className="mt-3 h-40 w-full rounded-xl border border-white/10 object-cover" />
                ) : null}
              </div>

              <button type="button" onClick={() => void submitPackage()} disabled={savingPackage} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-60">
                {savingPackage ? "Guardando..." : packageForm.id ? "Actualizar paquete" : "Crear paquete"}
              </button>
            </div>

            <MediaLibrary
              title="Galería de paquetes"
              files={packageMedia}
              selectedUrl={packageForm.coverImageUrl}
              onSelect={(file) => setPackageForm((current) => ({ ...current, coverImageUrl: file.url }))}
              onDelete={(file) => void deleteMedia("packages", file)}
              deletingKey={deletingMediaKey}
            />

            <div className="grid gap-3">
              {sortedPackages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setPackageForm({
                      id: item.id,
                      title: item.title,
                      description: item.description ?? "",
                      originCode: item.originCode,
                      destinationCode: item.destinationCode,
                      basePrice: String(item.basePrice),
                      coverImageUrl: item.coverImageUrl ?? "",
                      active: item.active,
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      {item.coverImageUrl ? <img src={item.coverImageUrl} alt={item.title} className="h-16 w-20 rounded-lg border border-white/10 object-cover" /> : null}
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {item.originCode} → {item.destinationCode} · {formatMoney(item.basePrice)}
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${item.active ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-700 text-zinc-200"}`}>
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Promociones</h2>
                <button type="button" onClick={() => setBannerForm(emptyBannerForm)} className="text-sm text-zinc-300 underline">
                  Nuevo
                </button>
              </div>

            <div className="grid gap-3">
              <input value={bannerForm.title} onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Título" />
              <input value={bannerForm.subtitle} onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Subtítulo" />
              <input value={bannerForm.altText} onChange={(event) => setBannerForm((current) => ({ ...current, altText: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Texto alternativo" />
              <input value={bannerForm.linkUrl} onChange={(event) => setBannerForm((current) => ({ ...current, linkUrl: event.target.value }))} className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Link" />

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Imagen de la promoción</div>
                    <p className="text-xs text-zinc-400">Sube el asset y úsalo desde la galería de promociones del panel.</p>
                  </div>
                  <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10">
                    {uploadingScope === "banners" ? "Subiendo..." : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingScope !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) {
                          void uploadMedia("banners", file);
                        }
                      }}
                    />
                  </label>
                </div>
                <input value={bannerForm.imageUrl} onChange={(event) => setBannerForm((current) => ({ ...current, imageUrl: event.target.value }))} className="mt-3 w-full rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="URL de imagen" />
                {bannerForm.imageUrl ? <img src={bannerForm.imageUrl} alt="Vista previa banner" className="mt-3 h-40 w-full rounded-xl border border-white/10 object-cover" /> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <input value={bannerForm.orderIndex} onChange={(event) => setBannerForm((current) => ({ ...current, orderIndex: event.target.value }))} type="number" min="0" step="1" className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10" placeholder="Orden" />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={bannerForm.isActive} onChange={(event) => setBannerForm((current) => ({ ...current, isActive: event.target.checked }))} />
                  Activo
                </label>
              </div>
              <button type="button" onClick={() => void submitBanner()} disabled={savingBanner} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-60">
                {savingBanner ? "Guardando..." : bannerForm.id ? "Actualizar banner" : "Crear banner"}
              </button>
            </div>

              <MediaLibrary
                title="Galería de promociones"
                files={bannerMedia}
                selectedUrl={bannerForm.imageUrl}
                onSelect={(file) => setBannerForm((current) => ({ ...current, imageUrl: file.url }))}
                onDelete={(file) => void deleteMedia("banners", file)}
                deletingKey={deletingMediaKey}
              />

            <div className="grid gap-3">
                {banners.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setBannerForm({
                            id: item.id,
                            title: item.title ?? "",
                            subtitle: item.subtitle ?? "",
                            altText: item.altText ?? "",
                            linkUrl: item.linkUrl ?? "",
                            imageUrl: item.imageUrl,
                            orderIndex: String(item.orderIndex),
                            isActive: item.isActive,
                          })
                        }
                        className="flex flex-1 gap-3 text-left"
                      >
                        <img src={item.imageUrl} alt={item.altText || item.title || "Banner"} className="h-16 w-20 rounded-lg border border-white/10 object-cover" />
                        <div>
                          <div className="font-medium">{item.title || "Promoción sin título"}</div>
                          <div className="mt-2 text-sm text-zinc-400">Prioridad {item.orderIndex} · {item.imageUrl}</div>
                        </div>
                      </button>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-700 text-zinc-200"}`}>
                          {item.isActive ? "Activo" : "Inactivo"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void swapBannerOrder(item, "up")}
                            disabled={savingBanner}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-100 transition hover:bg-white/10 disabled:opacity-60"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => void swapBannerOrder(item, "down")}
                            disabled={savingBanner}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-100 transition hover:bg-white/10 disabled:opacity-60"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteBanner(item.id)}
                          disabled={deletingBannerId === item.id}
                          className="rounded-lg border border-red-400/30 px-3 py-1 text-xs text-red-100 transition hover:bg-red-500/10 disabled:opacity-60"
                        >
                          {deletingBannerId === item.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </section>
      ) : null}
    </main>
  );
}

function MediaLibrary({
  title,
  files,
  selectedUrl,
  onSelect,
  onDelete,
  deletingKey,
}: {
  title: string;
  files: AdminMediaFileItem[];
  selectedUrl: string;
  onSelect: (file: AdminMediaFileItem) => void;
  onDelete: (file: AdminMediaFileItem) => void;
  deletingKey: string | null;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div>
        <div className="font-medium">{title}</div>
        <p className="text-xs text-zinc-400">Selecciona una imagen existente o bórrala si ya no debe seguir disponible.</p>
      </div>

      {files.length === 0 ? <div className="text-sm text-zinc-400">Aún no hay archivos cargados.</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const key = file.name;
          const isSelected = selectedUrl === file.url;
          return (
            <article key={file.name} className={`rounded-xl border p-3 ${isSelected ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
              <img src={file.url} alt={file.name} className="h-28 w-full rounded-lg border border-white/10 object-cover" />
              <div className="mt-3 break-all text-xs text-zinc-400">{file.name}</div>
              <div className="mt-1 text-xs text-zinc-500">{formatFileSize(file.size)}</div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onSelect(file)} className="rounded-lg border border-white/10 px-3 py-1 text-xs transition hover:bg-white/10">
                  Usar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file)}
                  disabled={deletingKey === key}
                  className="rounded-lg border border-red-400/30 px-3 py-1 text-xs text-red-100 transition hover:bg-red-500/10 disabled:opacity-60"
                >
                  {deletingKey === key ? "Borrando..." : "Borrar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
