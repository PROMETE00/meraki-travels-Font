import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-base-url";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const backendBaseUrl = getBackendBaseUrl();

  try {
    const backendUrl = new URL("/api/banners", backendBaseUrl);
    const active = url.searchParams.get("active");
    if (active) {
      backendUrl.searchParams.set("active", active);
    }

    const response = await fetch(backendUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || "No se pudo consultar el backend de banners." },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: "El backend de banners no está disponible en este momento." },
      { status: 502 },
    );
  }
}
