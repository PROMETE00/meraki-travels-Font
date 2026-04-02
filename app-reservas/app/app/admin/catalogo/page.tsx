"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminBannerItem,
  AdminDestinationItem,
  AdminMediaFileItem,
  AdminPromotionItem,
  AdminTravelPackageItem,
} from "@/features/search/types";
import { http, HttpError, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

type CatalogTab = "destinos" | "banners" | "promociones" | "paquetes";
type MediaScope = "packages" | "banners";

type SharedMediaFileItem = AdminMediaFileItem & {
  scope: MediaScope;
};

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

type PromotionFormState = {
  id: number | null;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  orderIndex: string;
  isActive: boolean;
  visibleInPromotions: boolean;
  visibleInDestinations: boolean;
  visibleInPackages: boolean;
  featuredInDome: boolean;
  packageIds: number[];
};

type DestinationFormState = {
  id: number | null;
  name: string;
  slug: string;
  country: string;
  summary: string;
  heroImageUrl: string;
  active: boolean;
  packageIds: number[];
  promotionIds: number[];
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

const emptyPromotionForm: PromotionFormState = {
  id: null,
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  orderIndex: "0",
  isActive: true,
  visibleInPromotions: true,
  visibleInDestinations: true,
  visibleInPackages: false,
  featuredInDome: false,
  packageIds: [],
};

const emptyDestinationForm: DestinationFormState = {
  id: null,
  name: "",
  slug: "",
  country: "",
  summary: "",
  heroImageUrl: "",
  active: true,
  packageIds: [],
  promotionIds: [],
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

export default function AdminCatalogoPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [activeTab, setActiveTab] = useState<CatalogTab>("destinos");

  const [packages, setPackages] = useState<AdminTravelPackageItem[]>([]);
  const [banners, setBanners] = useState<AdminBannerItem[]>([]);
  const [promotions, setPromotions] = useState<AdminPromotionItem[]>([]);
  const [destinations, setDestinations] = useState<AdminDestinationItem[]>([]);

  const [packageMedia, setPackageMedia] = useState<AdminMediaFileItem[]>([]);
  const [bannerMedia, setBannerMedia] = useState<AdminMediaFileItem[]>([]);

  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(emptyBannerForm);
  const [promotionForm, setPromotionForm] = useState<PromotionFormState>(emptyPromotionForm);
  const [destinationForm, setDestinationForm] = useState<DestinationFormState>(emptyDestinationForm);

  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingPromotion, setSavingPromotion] = useState(false);
  const [savingDestination, setSavingDestination] = useState(false);

  const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);
  const [deletingPromotionId, setDeletingPromotionId] = useState<number | null>(null);
  const [deletingDestinationId, setDeletingDestinationId] = useState<number | null>(null);

  const [uploadingScope, setUploadingScope] = useState<MediaScope | null>(null);
  const [deletingMediaKey, setDeletingMediaKey] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!token || !canOperate) {
      setPackages([]);
      setBanners([]);
      setPromotions([]);
      setDestinations([]);
      setPackageMedia([]);
      setBannerMedia([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const headers = buildAuthHeaders(token);
      const [
        packagesResponse,
        bannersResponse,
        promotionsResponse,
        destinationsResponse,
        packageMediaResponse,
        bannerMediaResponse,
      ] = await Promise.all([
        http<AdminTravelPackageItem[]>("/api/admin/packages", { headers }),
        http<AdminBannerItem[]>("/api/admin/banners", { headers }),
        http<AdminPromotionItem[]>("/api/admin/promotions", { headers }),
        http<AdminDestinationItem[]>("/api/admin/destinations", { headers }),
        http<{ files: AdminMediaFileItem[] }>("/api/admin/media/files?scope=packages", { headers }),
        http<{ files: AdminMediaFileItem[] }>("/api/admin/media/files?scope=banners", { headers }),
      ]);

      setPackages(packagesResponse);
      setBanners(bannersResponse);
      setPromotions(promotionsResponse);
      setDestinations(destinationsResponse);
      setPackageMedia(packageMediaResponse.files);
      setBannerMedia(bannerMediaResponse.files);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para administrar catálogo.");
      } else {
        setError("No pudimos cargar el catálogo administrativo.");
      }
    } finally {
      setLoading(false);
    }
  }, [canOperate, logout, token]);

  useEffect(() => {
    if (!hydrated) return;
    void loadCatalog();
  }, [hydrated, loadCatalog]);

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [packages],
  );

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.orderIndex - b.orderIndex),
    [banners],
  );

  const sortedPromotions = useMemo(
    () => [...promotions].sort((a, b) => a.orderIndex - b.orderIndex),
    [promotions],
  );

  const sortedDestinations = useMemo(
    () => [...destinations].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [destinations],
  );

  const sharedMedia = useMemo<SharedMediaFileItem[]>(() => {
    const records = new Map<string, SharedMediaFileItem>();
    const push = (scope: MediaScope, items: AdminMediaFileItem[]) => {
      for (const item of items) {
        const key = item.url || `${scope}:${item.name}`;
        if (!records.has(key)) records.set(key, { ...item, scope });
      }
    };
    push("packages", packageMedia);
    push("banners", bannerMedia);
    return [...records.values()];
  }, [bannerMedia, packageMedia]);

  async function submitPackage() {
    if (!token) return;
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
    if (!token) return;
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

  async function submitPromotion() {
    if (!token) return;
    try {
      setSavingPromotion(true);
      setError(null);
      setMessage(null);
      const payload = {
        title: promotionForm.title.trim(),
        subtitle: promotionForm.subtitle.trim(),
        description: promotionForm.description.trim(),
        imageUrl: promotionForm.imageUrl.trim(),
        linkUrl: promotionForm.linkUrl.trim(),
        orderIndex: Number(promotionForm.orderIndex),
        isActive: promotionForm.isActive,
        visibleInPromotions: promotionForm.visibleInPromotions,
        visibleInDestinations: promotionForm.visibleInDestinations,
        visibleInPackages: promotionForm.visibleInPackages,
        featuredInDome: promotionForm.featuredInDome,
        packageIds: promotionForm.packageIds,
      };
      const method = promotionForm.id ? "PUT" : "POST";
      const url = promotionForm.id ? `/api/admin/promotions/${promotionForm.id}` : "/api/admin/promotions";
      await http<AdminPromotionItem>(url, {
        method,
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      setMessage(promotionForm.id ? "Promoción actualizada." : "Promoción creada.");
      setPromotionForm(emptyPromotionForm);
      await loadCatalog();
    } catch (saveError) {
      console.error(saveError);
      setError("No pudimos guardar la promoción.");
    } finally {
      setSavingPromotion(false);
    }
  }

  async function submitDestination() {
    if (!token) return;
    try {
      setSavingDestination(true);
      setError(null);
      setMessage(null);
      const payload = {
        name: destinationForm.name.trim(),
        slug: destinationForm.slug.trim(),
        country: destinationForm.country.trim(),
        summary: destinationForm.summary.trim(),
        heroImageUrl: destinationForm.heroImageUrl.trim(),
        active: destinationForm.active,
        packageIds: destinationForm.packageIds,
        promotionIds: destinationForm.promotionIds,
      };
      const method = destinationForm.id ? "PUT" : "POST";
      const url = destinationForm.id ? `/api/admin/destinations/${destinationForm.id}` : "/api/admin/destinations";
      await http<AdminDestinationItem>(url, {
        method,
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      setMessage(destinationForm.id ? "Destino actualizado." : "Destino creado.");
      setDestinationForm(emptyDestinationForm);
      await loadCatalog();
    } catch (saveError) {
      console.error(saveError);
      setError("No pudimos guardar el destino.");
    } finally {
      setSavingDestination(false);
    }
  }

  async function deleteBanner(id: number) {
    if (!token) return;
    if (!window.confirm("¿Seguro que deseas eliminar este banner?")) return;

    try {
      setDeletingBannerId(id);
      setError(null);
      setMessage(null);
      await http<void>(`/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Banner eliminado.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage("No pudimos eliminar el banner.");
    } finally {
      setDeletingBannerId(null);
    }
  }

  async function deletePromotion(id: number) {
    if (!token) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta promoción?")) return;

    try {
      setDeletingPromotionId(id);
      setError(null);
      setMessage(null);
      await http<void>(`/api/admin/promotions/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Promoción eliminada.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage("No pudimos eliminar la promoción.");
    } finally {
      setDeletingPromotionId(null);
    }
  }

  async function deleteDestination(id: number) {
    if (!token) return;
    if (!window.confirm("¿Seguro que deseas eliminar este destino?")) return;

    try {
      setDeletingDestinationId(id);
      setError(null);
      setMessage(null);
      await http<void>(`/api/admin/destinations/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      setMessage("Destino eliminado.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage("No pudimos eliminar el destino.");
    } finally {
      setDeletingDestinationId(null);
    }
  }

  async function swapBannerOrder(item: AdminBannerItem, direction: "up" | "down") {
    if (!token) return;
    const sorted = [...banners].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = sorted.findIndex((entry) => entry.id === item.id);
    if (index === -1) return;

    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = sorted[neighborIndex];
    if (!neighbor) return;

    try {
      setSavingBanner(true);
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
      setMessage("Orden de banners actualizado.");
      await loadCatalog();
    } catch (err) {
      console.error(err);
      setMessage("No pudimos actualizar el orden.");
    } finally {
      setSavingBanner(false);
    }
  }

  async function togglePromotionVisibility(item: AdminPromotionItem) {
    if (!token) return;
    try {
      setSavingPromotion(true);
      await http<AdminPromotionItem>(`/api/admin/promotions/${item.id}`, {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: item.title,
          subtitle: item.subtitle ?? "",
          description: item.description ?? "",
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl ?? "",
          orderIndex: item.orderIndex,
          isActive: !item.isActive,
          visibleInPromotions: item.visibleInPromotions,
          visibleInDestinations: item.visibleInDestinations,
          visibleInPackages: item.visibleInPackages,
          featuredInDome: item.featuredInDome,
          packageIds: item.packageIds,
        }),
      });
      setMessage(!item.isActive ? "Promoción visible." : "Promoción oculta.");
      await loadCatalog();
    } catch (err) {
      console.error(err);
      setMessage("No pudimos cambiar la visibilidad de la promoción.");
    } finally {
      setSavingPromotion(false);
    }
  }

  async function togglePackageVisibility(item: AdminTravelPackageItem) {
    if (!token) return;
    try {
      setSavingPackage(true);
      await http<AdminTravelPackageItem>(`/api/admin/packages/${item.id}`, {
        method: "PUT",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: item.title,
          description: item.description ?? "",
          originCode: item.originCode,
          destinationCode: item.destinationCode,
          basePrice: item.basePrice,
          coverImageUrl: item.coverImageUrl ?? "",
          active: !item.active,
        }),
      });
      setMessage(!item.active ? "Paquete visible." : "Paquete oculto.");
      await loadCatalog();
    } catch (err) {
      console.error(err);
      setMessage("No pudimos cambiar la visibilidad del paquete.");
    } finally {
      setSavingPackage(false);
    }
  }

  async function uploadMedia(scope: MediaScope, file: File, onUploaded: (item: AdminMediaFileItem) => void) {
    if (!token) return;

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
      onUploaded(uploaded);
      setMessage("Imagen subida correctamente.");
      await loadCatalog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("No pudimos subir la imagen. Usa JPG, PNG, WEBP o GIF.");
    } finally {
      setUploadingScope(null);
    }
  }

  async function deleteMedia(scope: MediaScope, file: AdminMediaFileItem) {
    if (!token) return;

    try {
      setDeletingMediaKey(`${scope}:${file.name}`);
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
      setPromotionForm((current) => (current.imageUrl === file.url ? { ...current, imageUrl: "" } : current));
      setDestinationForm((current) => (current.heroImageUrl === file.url ? { ...current, heroImageUrl: "" } : current));
      setMessage("Archivo eliminado de la galería.");
      await loadCatalog();
    } catch (deleteError) {
      console.error(deleteError);
      setError("No pudimos eliminar la imagen seleccionada.");
    } finally {
      setDeletingMediaKey(null);
    }
  }

  function toggleDestinationPackage(packageId: number) {
    setDestinationForm((current) => ({
      ...current,
      packageIds: current.packageIds.includes(packageId)
        ? current.packageIds.filter((id) => id !== packageId)
        : [...current.packageIds, packageId],
    }));
  }

  function toggleDestinationPromotion(promotionId: number) {
    setDestinationForm((current) => ({
      ...current,
      promotionIds: current.promotionIds.includes(promotionId)
        ? current.promotionIds.filter((id) => id !== promotionId)
        : [...current.promotionIds, promotionId],
    }));
  }

  function togglePromotionPackage(packageId: number) {
    setPromotionForm((current) => ({
      ...current,
      packageIds: current.packageIds.includes(packageId)
        ? current.packageIds.filter((id) => id !== packageId)
        : [...current.packageIds, packageId],
    }));
  }

  return (
    <main className="space-y-6 p-6 text-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Catálogo de contenidos</h1>
          <p className="text-sm text-slate-600">Cada dominio se administra por separado: destinos, banners, promociones y paquetes.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadCatalog()}
          disabled={!canOperate}
          className="rounded-xl bg-[#4C5372] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4C5372]/90 disabled:opacity-60"
        >
          Actualizar
        </button>
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {!hydrated ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Cargando sesión...</div> : null}
      {hydrated && !customer ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">Necesitas iniciar sesión.</div> : null}
      {hydrated && customer && !canOperate ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Tu cuenta no tiene permisos para gestionar catálogo.</div> : null}
      {hydrated && canOperate && loading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Cargando catálogo...</div> : null}

      {hydrated && canOperate ? (
        <>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {([
              ["destinos", "Destinos"],
              ["banners", "Banners"],
              ["promociones", "Promociones"],
              ["paquetes", "Paquetes"],
            ] as [CatalogTab, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${activeTab === value ? "bg-[#4C5372] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {label}
              </button>
            ))}
            <Link href="/app/admin/dome" className="ml-auto rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Gestionar Dome
            </Link>
          </div>

          {activeTab === "destinos" ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Destinos</h2>
                <button type="button" onClick={() => setDestinationForm(emptyDestinationForm)} className="text-sm text-slate-500 underline">
                  Nuevo
                </button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={destinationForm.name} onChange={(event) => setDestinationForm((c) => ({ ...c, name: event.target.value }))} className="app-input" placeholder="Nombre destino" />
                  <input value={destinationForm.slug} onChange={(event) => setDestinationForm((c) => ({ ...c, slug: event.target.value }))} className="app-input" placeholder="slug-destino" />
                </div>
                <input value={destinationForm.country} onChange={(event) => setDestinationForm((c) => ({ ...c, country: event.target.value }))} className="app-input" placeholder="País" />
                <textarea value={destinationForm.summary} onChange={(event) => setDestinationForm((c) => ({ ...c, summary: event.target.value }))} className="min-h-24 app-input" placeholder="Resumen del destino" />
                <input value={destinationForm.heroImageUrl} onChange={(event) => setDestinationForm((c) => ({ ...c, heroImageUrl: event.target.value }))} className="app-input" placeholder="URL imagen portada destino" />
                <label className="app-secondary-button cursor-pointer w-fit">
                  {uploadingScope === "packages" ? "Subiendo..." : "Subir portada"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingScope !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) {
                        void uploadMedia("packages", file, (uploaded) => setDestinationForm((c) => ({ ...c, heroImageUrl: uploaded.url })));
                      }
                    }}
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="mb-2 text-sm font-medium text-slate-700">Paquetes del destino</div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {sortedPackages.map((item) => (
                        <label key={`d-p-${item.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={destinationForm.packageIds.includes(item.id)} onChange={() => toggleDestinationPackage(item.id)} />
                          {item.title}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="mb-2 text-sm font-medium text-slate-700">Promociones del destino</div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {sortedPromotions.map((item) => (
                        <label key={`d-pr-${item.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={destinationForm.promotionIds.includes(item.id)} onChange={() => toggleDestinationPromotion(item.id)} />
                          {item.title}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={destinationForm.active} onChange={(event) => setDestinationForm((c) => ({ ...c, active: event.target.checked }))} />
                  Activo
                </label>

                <button type="button" onClick={() => void submitDestination()} disabled={savingDestination} className="app-primary-button">
                  {savingDestination ? "Guardando..." : destinationForm.id ? "Actualizar destino" : "Crear destino"}
                </button>
              </div>

              <div className="grid gap-3">
                {sortedDestinations.map((item) => (
                   <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                         <div className="text-xs text-slate-500">/{item.slug} · {item.country || "Sin país"}</div>
                         <div className="text-xs text-slate-500">{item.packageIds.length} paquetes · {item.promotionIds.length} promociones</div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setDestinationForm({ id: item.id, name: item.name, slug: item.slug, country: item.country ?? "", summary: item.summary ?? "", heroImageUrl: item.heroImageUrl ?? "", active: item.active, packageIds: item.packageIds, promotionIds: item.promotionIds })} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">Editar</button>
                        <button type="button" onClick={() => void deleteDestination(item.id)} disabled={deletingDestinationId === item.id} className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingDestinationId === item.id ? "Eliminando..." : "Eliminar"}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

           {activeTab === "banners" ? (
             <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Banners de fondo</h2>
                <button type="button" onClick={() => setBannerForm(emptyBannerForm)} className="text-sm text-slate-500 underline">Nuevo</button>
              </div>

              <div className="grid gap-3">
                 <input value={bannerForm.title} onChange={(event) => setBannerForm((c) => ({ ...c, title: event.target.value }))} className="app-input" placeholder="Título" />
                 <input value={bannerForm.subtitle} onChange={(event) => setBannerForm((c) => ({ ...c, subtitle: event.target.value }))} className="app-input" placeholder="Subtítulo" />
                 <input value={bannerForm.altText} onChange={(event) => setBannerForm((c) => ({ ...c, altText: event.target.value }))} className="app-input" placeholder="Texto alternativo" />
                 <input value={bannerForm.linkUrl} onChange={(event) => setBannerForm((c) => ({ ...c, linkUrl: event.target.value }))} className="app-input" placeholder="Link" />
                 <input value={bannerForm.imageUrl} onChange={(event) => setBannerForm((c) => ({ ...c, imageUrl: event.target.value }))} className="app-input" placeholder="URL imagen" />
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input value={bannerForm.orderIndex} onChange={(event) => setBannerForm((c) => ({ ...c, orderIndex: event.target.value }))} type="number" min="0" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Orden" />
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={bannerForm.isActive} onChange={(event) => setBannerForm((c) => ({ ...c, isActive: event.target.checked }))} /> Activo</label>
                </div>
                 <label className="app-secondary-button cursor-pointer w-fit">
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
                        void uploadMedia("banners", file, (uploaded) => setBannerForm((c) => ({ ...c, imageUrl: uploaded.url })));
                      }
                    }}
                  />
                </label>
                 <button type="button" onClick={() => void submitBanner()} disabled={savingBanner} className="app-primary-button">
                  {savingBanner ? "Guardando..." : bannerForm.id ? "Actualizar banner" : "Crear banner"}
                </button>
              </div>

              <div className="grid gap-3">
                {sortedBanners.map((item) => (
                   <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button type="button" onClick={() => setBannerForm({ id: item.id, title: item.title ?? "", subtitle: item.subtitle ?? "", altText: item.altText ?? "", linkUrl: item.linkUrl ?? "", imageUrl: item.imageUrl, orderIndex: String(item.orderIndex), isActive: item.isActive })} className="flex flex-1 gap-3 text-left">
                         <img src={item.imageUrl} alt={item.altText || item.title || "Banner"} className="h-16 w-20 rounded-lg border border-slate-200 object-cover" />
                        <div>
                          <div className="font-medium">{item.title || "Banner sin título"}</div>
                          <div className="text-xs text-slate-500">Orden {item.orderIndex}</div>
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void swapBannerOrder(item, "up")} disabled={savingBanner} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">↑</button>
                        <button type="button" onClick={() => void swapBannerOrder(item, "down")} disabled={savingBanner} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">↓</button>
                        <button type="button" onClick={() => void deleteBanner(item.id)} disabled={deletingBannerId === item.id} className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingBannerId === item.id ? "Eliminando..." : "Eliminar"}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

           {activeTab === "promociones" ? (
             <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Promociones</h2>
                <button type="button" onClick={() => setPromotionForm(emptyPromotionForm)} className="text-sm text-slate-500 underline">Nueva</button>
              </div>

              <div className="grid gap-3">
                 <input value={promotionForm.title} onChange={(event) => setPromotionForm((c) => ({ ...c, title: event.target.value }))} className="app-input" placeholder="Título" />
                 <input value={promotionForm.subtitle} onChange={(event) => setPromotionForm((c) => ({ ...c, subtitle: event.target.value }))} className="app-input" placeholder="Subtítulo" />
                 <textarea value={promotionForm.description} onChange={(event) => setPromotionForm((c) => ({ ...c, description: event.target.value }))} className="min-h-24 app-input" placeholder="Descripción" />
                 <input value={promotionForm.imageUrl} onChange={(event) => setPromotionForm((c) => ({ ...c, imageUrl: event.target.value }))} className="app-input" placeholder="URL imagen" />
                 <input value={promotionForm.linkUrl} onChange={(event) => setPromotionForm((c) => ({ ...c, linkUrl: event.target.value }))} className="app-input" placeholder="Link" />
                 <input value={promotionForm.orderIndex} onChange={(event) => setPromotionForm((c) => ({ ...c, orderIndex: event.target.value }))} type="number" min="0" className="app-input" placeholder="Orden" />

                 <label className="app-secondary-button cursor-pointer w-fit">
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
                        void uploadMedia("banners", file, (uploaded) => setPromotionForm((c) => ({ ...c, imageUrl: uploaded.url })));
                      }
                    }}
                  />
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                   <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={promotionForm.isActive} onChange={(event) => setPromotionForm((c) => ({ ...c, isActive: event.target.checked }))} /> Activa</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={promotionForm.visibleInPromotions} onChange={(event) => setPromotionForm((c) => ({ ...c, visibleInPromotions: event.target.checked }))} /> Visible en listado promociones</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={promotionForm.visibleInDestinations} onChange={(event) => setPromotionForm((c) => ({ ...c, visibleInDestinations: event.target.checked }))} /> Visible en destinos</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={promotionForm.visibleInPackages} onChange={(event) => setPromotionForm((c) => ({ ...c, visibleInPackages: event.target.checked }))} /> Visible en paquetes</label>
                   <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={promotionForm.featuredInDome} onChange={(event) => setPromotionForm((c) => ({ ...c, featuredInDome: event.target.checked }))} /> Marcar para Dome</label>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-700">Paquetes relacionados</div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {sortedPackages.map((item) => (
                      <label key={`pr-p-${item.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={promotionForm.packageIds.includes(item.id)} onChange={() => togglePromotionPackage(item.id)} />
                        {item.title}
                      </label>
                    ))}
                  </div>
                </div>

                 <button type="button" onClick={() => void submitPromotion()} disabled={savingPromotion} className="app-primary-button">
                  {savingPromotion ? "Guardando..." : promotionForm.id ? "Actualizar promoción" : "Crear promoción"}
                </button>
              </div>

              <div className="grid gap-3">
                {sortedPromotions.map((item) => (
                   <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setPromotionForm({
                            id: item.id,
                            title: item.title,
                            subtitle: item.subtitle ?? "",
                            description: item.description ?? "",
                            imageUrl: item.imageUrl,
                            linkUrl: item.linkUrl ?? "",
                            orderIndex: String(item.orderIndex),
                            isActive: item.isActive,
                            visibleInPromotions: item.visibleInPromotions,
                            visibleInDestinations: item.visibleInDestinations,
                            visibleInPackages: item.visibleInPackages,
                            featuredInDome: item.featuredInDome,
                            packageIds: item.packageIds,
                          })
                        }
                        className="flex flex-1 gap-3 text-left"
                      >
                         <img src={item.imageUrl} alt={item.title} className="h-16 w-20 rounded-lg border border-slate-200 object-cover" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-slate-500">{item.packageIds.length} paquetes · orden {item.orderIndex}</div>
                        </div>
                      </button>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void togglePromotionVisibility(item)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">{item.isActive ? "Ocultar" : "Mostrar"}</button>
                        <button type="button" onClick={() => void deletePromotion(item.id)} disabled={deletingPromotionId === item.id} className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingPromotionId === item.id ? "Eliminando..." : "Eliminar"}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "paquetes" ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Paquetes</h2>
                <button type="button" onClick={() => setActiveTab("destinos")} className="text-sm text-slate-500 underline">Crear/editar paquete</button>
              </div>

              <p className="text-sm text-slate-600">Administra visibilidad del paquete y decide si lo conviertes en promoción reutilizable.</p>

              <div className="grid gap-3">
                 {sortedPackages.map((item) => (
                   <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.originCode} → {item.destinationCode} · {formatMoney(item.basePrice)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void togglePackageVisibility(item)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">{item.active ? "Ocultar" : "Mostrar"}</button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromotionForm((current) => ({
                              ...current,
                              id: null,
                              title: item.title,
                              subtitle: current.subtitle,
                              description: item.description ?? current.description,
                              imageUrl: item.coverImageUrl ?? current.imageUrl,
                              packageIds: Array.from(new Set([...current.packageIds, item.id])),
                              visibleInPackages: true,
                            }));
                            setActiveTab("promociones");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Convertir a promoción
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPackageForm({
                              id: item.id,
                              title: item.title,
                              description: item.description ?? "",
                              originCode: item.originCode,
                              destinationCode: item.destinationCode,
                              basePrice: String(item.basePrice),
                              coverImageUrl: item.coverImageUrl ?? "",
                              active: item.active,
                            });
                            setActiveTab("destinos");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <SharedMediaLibrary
            files={sharedMedia}
            selectedPackageUrl={packageForm.coverImageUrl}
            selectedBannerUrl={bannerForm.imageUrl}
            onUseForPackage={(file) => {
              setPackageForm((current) => ({ ...current, coverImageUrl: file.url }));
              setDestinationForm((current) => ({ ...current, heroImageUrl: file.url }));
            }}
            onUseForBanner={(file) => {
              setBannerForm((current) => ({ ...current, imageUrl: file.url }));
              setPromotionForm((current) => ({ ...current, imageUrl: file.url }));
            }}
            onDelete={(file) => void deleteMedia(file.scope, file)}
            deletingKey={deletingMediaKey}
          />
        </>
      ) : null}
    </main>
  );
}

function SharedMediaLibrary({
  files,
  selectedPackageUrl,
  selectedBannerUrl,
  onUseForPackage,
  onUseForBanner,
  onDelete,
  deletingKey,
}: {
  files: SharedMediaFileItem[];
  selectedPackageUrl: string;
  selectedBannerUrl: string;
  onUseForPackage: (file: SharedMediaFileItem) => void;
  onUseForBanner: (file: SharedMediaFileItem) => void;
  onDelete: (file: SharedMediaFileItem) => void;
  deletingKey: string | null;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="font-medium text-slate-900">Galería compartida de referencias</div>
        <p className="text-xs text-slate-500">Imágenes reutilizables, sin vínculo automático obligatorio.</p>
      </div>

      {files.length === 0 ? <div className="text-sm text-slate-500">Aún no hay archivos cargados.</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const key = `${file.scope}:${file.name}`;
          const isSelectedPackage = selectedPackageUrl === file.url;
          const isSelectedBanner = selectedBannerUrl === file.url;
          return (
            <article key={key} className="rounded-xl border border-slate-200 bg-[#FFFDF6] p-3">
              <img src={file.url} alt={file.name} className="h-28 w-full rounded-lg border border-slate-200 object-cover" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="break-all text-xs text-slate-500">{file.name}</div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                  {file.scope === "packages" ? "Destinos" : "Banners"}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)}</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onUseForPackage(file)}
                  className={`rounded-lg border px-3 py-1 text-xs transition ${isSelectedPackage ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                >
                  Usar en destino/paquete
                </button>
                <button
                  type="button"
                  onClick={() => onUseForBanner(file)}
                  className={`rounded-lg border px-3 py-1 text-xs transition ${isSelectedBanner ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                >
                  Usar en banner/promoción
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file)}
                  disabled={deletingKey === key}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60"
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
