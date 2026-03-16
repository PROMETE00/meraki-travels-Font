// lib/nocodb.ts
export type ImageAsset = {
  id: number;
  owner_table: string;
  owner_id: number;
  path: string;
  alt_text?: string | null;
  is_cover?: boolean | null;
};

type NocoDbRow = {
  id?: number | string;
  owner_table?: string;
  owner_id?: number | string;
  path?: string;
  alt_text?: string | null;
  is_cover?: boolean | null;
};

type NocoDbListResponse = {
  list?: NocoDbRow[];
  rows?: NocoDbRow[];
};

const baseUrl  = process.env.NOCODB_BASE_URL!;
const sharedId = process.env.NOCODB_SHARED_VIEW_ID || "";
const svPwd    = process.env.NOCODB_SHARED_VIEW_PWD || process.env.NOCODB_SHARED_VIEW_PASSWORD || ""; // opcional

export async function fetchImages(
  ownerTable: string,
  ownerId: number,
  limit = 20
): Promise<ImageAsset[]> {
  if (!baseUrl)  throw new Error("Falta NOCODB_BASE_URL");
  if (!sharedId) throw new Error("Falta NOCODB_SHARED_VIEW_ID");

  const url = new URL(`${baseUrl}/api/v2/public/shared-view/${sharedId}/rows`);
  url.searchParams.set("where", JSON.stringify({
    _and: [
      { owner_table: { _eq: ownerTable } },
      { owner_id:    { _eq: ownerId } },
    ],
  }));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", JSON.stringify([["is_cover","desc"],["id","asc"]]));

  const headers: Record<string,string> = {};
  if (svPwd) headers["x-shared-view-password"] = svPwd;

  const res = await fetch(url.toString(), { cache: "no-store", headers });
  if (!res.ok) throw new Error(`NocoDB ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as NocoDbListResponse | NocoDbRow[];
  const rows = Array.isArray(data) ? data : (data.list ?? data.rows ?? []);
  return rows.map((r) => ({
    id: Number(r.id),
    owner_table: String(r.owner_table),
    owner_id: Number(r.owner_id),
    path: String(r.path),
    alt_text: r.alt_text ?? null,
    is_cover: !!r.is_cover,
  }));
}
