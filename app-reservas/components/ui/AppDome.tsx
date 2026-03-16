// components/ui/AppDome.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DomeGallery from "@/components/DomeGallery";

type DomeImageData = {
  id: number;
  destinationName: string;
  imageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  // Campos de promoción
  promoLabel?: string | null;
  promoBadge?: string | null;
};

type GalleryImage = {
  src: string;
  alt: string;
  label?: string;
  badge?: string;
  id?: number;
  linkUrl?: string;
};

export default function AppDome() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const fetchImages = async () => {
      try {
        const url = "/api/dome-images";

        const response = await fetch(url, {
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Dome images error:", response.status, response.statusText, url);
          if (active) setImages([]); // fallback sin romper UI
          return;
        }

        const payload = await response.json();
        const data: DomeImageData[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        const normalized: GalleryImage[] = data
          .filter((item) => Boolean(item?.imageUrl))
          .map((item) => ({
            src: item.imageUrl,
            alt: item.altText ?? item.destinationName,
            label: item.destinationName,
            badge: item.promoBadge ?? item.promoLabel ?? "",
            id: item.id,
            linkUrl: item.linkUrl ?? undefined,
          }));

        if (active) setImages(normalized);
      } catch (err) {
        console.error("Failed to fetch dome images:", err);
        if (active) setImages([]); // fallback
      } 
    };

    fetchImages();
    return () => {
      active = false;
    };
  }, []);

  const handleItemClick = (item: { src: string; alt: string; label: string; badge: string; id?: number; linkUrl?: string }) => {
    // Navigate to the link URL or a default packages page
    if (item.linkUrl) {
      router.push(item.linkUrl);
    } else if (item.id) {
      router.push(`/viaje/${item.id}`);
    } else {
      router.push("/paquetes");
    }
  };

  return (
    <div className="w-full h-full grid place-items-center">
      <DomeGallery
        images={images.length > 0 ? images : undefined}
        fit={0.38}
        minRadius={280}
        padFactor={0.10}
        overlayBlurColor="transparent"
        grayscale={false}
        maxVerticalRotationDeg={0}
        onItemClick={handleItemClick}
      />
    </div>
  );
}
