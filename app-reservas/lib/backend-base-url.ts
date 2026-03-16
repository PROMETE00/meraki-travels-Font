const DEFAULT_BACKEND_URL = "https://merakitravelsbackend.prome.works";

export function getBackendBaseUrl() {
  return process.env.INTERNAL_API_BASE_URL ?? process.env.APP_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}
