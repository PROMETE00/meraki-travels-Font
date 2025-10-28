"use client";
import dynamic from "next/dynamic";

// Carga DotGrid solo en cliente (usa canvas/DOM)
const DotGrid = dynamic(() => import("@/components/DotGrid"), { ssr: false });

type Props = Partial<{
  dotSize: number;
  gap: number;
  baseColor: string;
  activeColor: string;
  proximity: number;
  shockRadius: number;
  shockStrength: number;
  resistance: number;
  returnDuration: number;
}>;

export default function BackgroundDots(props: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <DotGrid
        dotSize={2}
        gap={15}
        baseColor="#5F7BA5"
        activeColor="#5F7BA5"
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
        {...props}
      />
    </div>
  );
}
