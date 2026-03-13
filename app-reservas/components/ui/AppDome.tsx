// components/ui/AppDome.tsx
"use client";
import { useEffect, useState } from "react";
import DomeGallery from "@/components/DomeGallery";

type DomeImageData = {
  id: number;
  destinationName: string;
  imageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
};

export default function AppDome() {
  const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchImages = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${API_URL}/api/dome-images`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch dome images");
        const data = (await response.json()) as DomeImageData[];
        if (active) {
          setImages(
            data.map((img) => ({
              src: img.imageUrl,
              alt: img.altText || img.destinationName,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading dome images:", error);
        // Keep empty array - DomeGallery has fallback defaults
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchImages();
    return () => {
      active = false;
    };
  }, []);

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
      />
    </div>
  );
}

