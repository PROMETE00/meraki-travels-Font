// app/api/search/route.ts
//
// This endpoint handles search queries for flights, hotels and activities. It
// previously only returned a fixed set of sample items based on `from` and
// `to` parameters. It now accepts an optional `q` parameter for free‑text
// searches. When `q` is provided the sample items are filtered by a
// case‑insensitive match on the `title` field. If no results match, an empty
// array is returned. When `q` is absent, the original behaviour of
// constructing sample items from `from` and `to` is preserved.

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const from = url.searchParams.get("from") ?? "OAX";
  const to = url.searchParams.get("to") ?? "MEX";

  // Static sample data used for demonstration purposes. In a real
  // application this would query a database or external API.
  const sampleItems = [
    { id: "f1", type: "vuelo", title: `Vuelo ${from} → ${to}`, price: 2450 },
    { id: "h1", type: "hotel", title: `Hotel en ${to} 3⭐`, price: 3100 },
    { id: "t1", type: "tour", title: `Tour por ${to}`, price: 890 },
  ];

  let items = sampleItems;

  // If a search query was provided, filter the sample items by title.
  if (q) {
    const lcQuery = q.toLowerCase();
    items = sampleItems.filter((it) => it.title.toLowerCase().includes(lcQuery));
  }

  return NextResponse.json({ items });
}