"use client";
import dynamic from "next/dynamic";

// Carga DomeGallery solo en cliente
const DomeGallery = dynamic(() => import("@/components/DomeGallery"), {
  ssr: false,
});

export default function AppDome() {
  return (
    <div className="w-screen h-[100svh]">
      <DomeGallery />
    </div>
  );
}
