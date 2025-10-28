// components/ui/AppDome.tsx
"use client";
import DomeGallery from "@/components/DomeGallery";

export default function AppDome() {
  return (
    <div className="w-full h-full grid place-items-center">
      <DomeGallery
        // más compacta
        fit={0.38}
        minRadius={280}
        padFactor={0.10}
        // sin fondo/gradientes/blur
        overlayBlurColor="transparent"
        // si no quieres blanco y negro:
         grayscale={false}
      />
    </div>
  );
}
