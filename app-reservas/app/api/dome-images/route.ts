import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-base-url";

export const revalidate = 120;

export async function GET() {
  const backendBaseUrl = getBackendBaseUrl();

  try {
    const backendUrl = new URL("/api/dome-images", backendBaseUrl);
    const response = await fetch(backendUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || "No se pudo consultar el backend de imágenes del Dome." },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: "El backend del Dome no está disponible en este momento." },
      { status: 502 },
    );
  }
}
