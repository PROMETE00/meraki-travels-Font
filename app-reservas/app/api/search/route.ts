import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-base-url";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const backendBaseUrl = getBackendBaseUrl();

  try {
    const backendUrl = new URL("/api/packages/search", backendBaseUrl);
    for (const [key, value] of url.searchParams.entries()) {
      backendUrl.searchParams.set(key, value);
    }

    const response = await fetch(backendUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || "No se pudo consultar el backend de paquetes." },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: "El backend de paquetes no está disponible en este momento." },
      { status: 502 },
    );
  }
}
