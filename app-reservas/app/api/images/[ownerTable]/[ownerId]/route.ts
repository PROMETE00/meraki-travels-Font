// app/api/images/[ownerTable]/[ownerId]/route.ts
import { NextResponse } from "next/server";
import { fetchImages } from "@/lib/nocodb";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ ownerTable: string; ownerId: string }> }
) {
  try {
    const { ownerTable, ownerId } = await ctx.params; // ⬅️ Next 16
    const images = await fetchImages(ownerTable, Number(ownerId), 50);
    return NextResponse.json({ images });
  } catch (e: any) {
    console.error("API /images error:", e?.message);
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}