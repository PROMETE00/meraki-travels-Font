// lib/http.ts
export async function http<T = any>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
