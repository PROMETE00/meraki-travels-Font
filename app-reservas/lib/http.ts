export class HttpError extends Error {
  status: number;
  body: string;

  constructor(status: number, message: string, body: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(body: string, status: number) {
  if (!body) {
    return `HTTP ${status}`;
  }

  try {
    const parsed = JSON.parse(body) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {}

  return body;
}

export function isHttpErrorStatus(error: unknown, status: number): error is HttpError {
  return error instanceof HttpError && error.status === status;
}

export async function http<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts });
  if (!res.ok) {
    const text = await res.text();
    throw new HttpError(res.status, extractErrorMessage(text, res.status), text);
  }
  return res.json() as Promise<T>;
}
