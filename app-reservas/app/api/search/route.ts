// app/api/search/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? "OAX";
  const to = url.searchParams.get("to") ?? "MEX";

  // Datos de ejemplo
  const items = [
    { id: "f1", type: "vuelo", title: `Vuelo ${from} → ${to}`, price: 2450 },
    { id: "h1", type: "hotel", title: `Hotel en ${to} 3⭐`, price: 3100 },
    { id: "t1", type: "tour", title: `Tour por ${to}`, price: 890 },
  ];

  return NextResponse.json({ items });
}