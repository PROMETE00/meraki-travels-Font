"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CardNav from "@/components/CardNav";

type Props = {
  onHeightChange?: (height: number) => void;
  topRem?: number;
};

export default function SearchNav({ onHeightChange, topRem = 0.75 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<HTMLDivElement | null>(null);
  const [measuredH, setMeasuredH] = useState(0);

  useLayoutEffect(() => {
    const el = posRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h && h !== measuredH) {
        setMeasuredH(h);
        onHeightChange?.(h);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const t1 = setTimeout(measure, 180);
    const t2 = setTimeout(measure, 420);
    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (measuredH) onHeightChange?.(measuredH);
  }, [measuredH, onHeightChange]);

  const topPx = topRem * 16;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div ref={hostRef} className="relative">
        <div
          ref={posRef}
          className="absolute inset-x-0 z-50"
          style={{ top: `${topRem}rem` }}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <CardNav />
        </div>

        <div
          aria-hidden
          className="pointer-events-none"
          style={{ height: (measuredH || 64) + topPx }}
        />
      </div>
    </div>
  );
}