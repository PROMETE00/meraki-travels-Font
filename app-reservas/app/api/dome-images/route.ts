import { NextResponse } from "next/server";

export const revalidate = 120;

export async function GET() {
  const backendBaseUrl =
    process.env.INTERNAL_API_BASE_URL ?? "https://merakitravelsbackend.prome.works";

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
