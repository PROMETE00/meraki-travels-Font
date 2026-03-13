import { NextResponse } from "next/server";
import { fetchImages } from "@/lib/nocodb";

// En Next 16, params es Promise -> await ctx.params
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ ownerTable: string; ownerId: string }> }
) {
  const { ownerTable, ownerId } = await ctx.params;
  try {
    const images = await fetchImages(ownerTable, Number(ownerId), 50);
    return NextResponse.json({ images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
